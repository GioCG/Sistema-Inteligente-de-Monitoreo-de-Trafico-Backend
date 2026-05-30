'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectPlateFromImage, normalizePlateValue } from '../plate/plate-service.js';
import { getVehicleByPlate } from '../vehicle/vehicle-model.js';
import {
  ensureTrafficLightExists,
  createIotSpeedEvent,
  createIotEvidence,
  createIotFine
} from './iot-model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');
const evidenceDir = path.join(backendRoot, 'configs', 'data', 'evidence');

const DEFAULT_SPEED_LIMIT = Number(process.env.SPEED_LIMIT_KMH || 20);
const DEFAULT_SPEED_FINE = Number(process.env.SPEED_FINE_AMOUNT || 500);
const DEFAULT_RED_LIGHT_FINE = Number(process.env.RED_LIGHT_FINE_AMOUNT || 200);

const ensureEvidenceDir = () => {
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
};

const getUploadedFile = (req) => {
  if (req.file) return req.file;

  if (req.files?.image?.length) {
    return req.files.image[0];
  }

  if (req.files?.images?.length) {
    return req.files.images[0];
  }

  return null;
};

const toBool = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 'si', 'sí', 'yes', 'y'].includes(normalized);
};

const getFineInfo = ({ speed, speedLimit, trafficLightStatus, vehicleCrossedLine, violationType }) => {
  const speeding = speed > speedLimit;
  const redLight = trafficLightStatus === 'RED' && vehicleCrossedLine;

  if (!speeding && !redLight) {
    return { violation: false, amount: 0, description: 'Evento sin infracción' };
  }

  let amount = 0;
  const reasons = [];

  if (speeding) {
    amount += DEFAULT_SPEED_FINE;
    reasons.push(`exceso de velocidad (${speed.toFixed(2)} km/h; límite ${speedLimit.toFixed(2)} km/h)`);
  }

  if (redLight) {
    amount += DEFAULT_RED_LIGHT_FINE;
    reasons.push('cruce con semáforo en rojo');
  }

  const typeText = violationType || (speeding && redLight ? 'SPEEDING_AND_RED_LIGHT' : speeding ? 'SPEEDING' : 'RED_LIGHT');

  return {
    violation: true,
    amount,
    description: `Infracción IoT ${typeText}: ${reasons.join(' y ')}.`
  };
};

export const iotHealth = (req, res) => {
  return res.status(200).json({
    estado: true,
    msg: 'Ruta IoT activa',
    expected_post: '/traffic-control/v1/iot/speed-detection',
    required_header: 'x-token',
    required_file_field: 'image',
    alternative_file_field: 'images'
  });
};

export const iotJsonTest = async (req, res) => {
  try {
    const speed = Number(req.body.speed || 25.5);
    const speedLimit = Number(req.body.speed_limit || DEFAULT_SPEED_LIMIT);
    const trafficLightId = Number(req.body.traffic_light_id || 1);
    const trafficLightStatus = String(req.body.traffic_light_status || 'GREEN').toUpperCase();
    const vehicleCrossedLine = toBool(req.body.vehicle_crossed_line ?? true);
    const violationType = String(req.body.violation_type || '').trim();

    const validTrafficLightId = await ensureTrafficLightExists(trafficLightId);
    const fineInfo = getFineInfo({ speed, speedLimit, trafficLightStatus, vehicleCrossedLine, violationType });

    const eventResult = await createIotSpeedEvent({
      speed,
      traffic_light_status: trafficLightStatus,
      violation: fineInfo.violation,
      traffic_light_id: validTrafficLightId,
      plate: null,
      detected_plate: null
    });

    let fineId = null;
    if (fineInfo.violation) {
      const fineResult = await createIotFine({
        amount: fineInfo.amount,
        description: fineInfo.description,
        event_id: eventResult.insertId
      });
      fineId = fineResult?.insertId || null;
    }

    return res.status(201).json({
      estado: true,
      msg: 'Prueba IoT JSON creada correctamente',
      event_id: eventResult.insertId,
      fine_id: fineId,
      violation: fineInfo.violation
    });
  } catch (error) {
    console.error('[IOT] Error test-json:', error);
    return res.status(500).json({ estado: false, error: error.message });
  }
};

export const receiveSpeedDetection = async (req, res) => {
  const uploadedFile = getUploadedFile(req);
  const tempPath = uploadedFile?.path;

  console.log('[IOT] POST /speed-detection recibido');
  console.log('[IOT] body:', req.body);
  console.log('[IOT] file:', uploadedFile ? { fieldname: uploadedFile.fieldname, path: uploadedFile.path, mimetype: uploadedFile.mimetype, size: uploadedFile.size } : null);

  try {
    if (!uploadedFile || !tempPath) {
      return res.status(400).json({
        estado: false,
        msg: 'Falta imagen. Envía multipart/form-data con campo image o images.',
        received_fields: Object.keys(req.body || {})
      });
    }

    const speed = Number(req.body.speed);
    const speedLimit = Number(req.body.speed_limit || DEFAULT_SPEED_LIMIT);
    const trafficLightId = Number(req.body.traffic_light_id || 1);
    const trafficLightStatus = String(req.body.traffic_light_status || 'GREEN').trim().toUpperCase();
    const vehicleCrossedLine = toBool(req.body.vehicle_crossed_line ?? req.body.crossed_line ?? true);
    const violationType = String(req.body.violation_type || '').trim().toUpperCase();

    if (!Number.isFinite(speed) || speed < 0) {
      return res.status(400).json({ estado: false, msg: 'speed inválida' });
    }

    if (!Number.isFinite(speedLimit) || speedLimit <= 0) {
      return res.status(400).json({ estado: false, msg: 'speed_limit inválido' });
    }

    ensureEvidenceDir();

    const manualPlate = normalizePlateValue(req.body.plate);
    let detectedPlate = manualPlate;
    let ocrError = null;

    if (!detectedPlate) {
      try {
        detectedPlate = await detectPlateFromImage(tempPath);
      } catch (error) {
        ocrError = error.message;
        console.warn('[IOT] OCR no disponible o falló:', ocrError);
      }
    }

    const vehicle = detectedPlate ? await getVehicleByPlate(detectedPlate) : null;
    const plateForFk = vehicle ? detectedPlate : null;
    const validTrafficLightId = await ensureTrafficLightExists(trafficLightId);
    const fineInfo = getFineInfo({ speed, speedLimit, trafficLightStatus, vehicleCrossedLine, violationType });

    const eventResult = await createIotSpeedEvent({
      speed,
      traffic_light_status: trafficLightStatus,
      violation: fineInfo.violation,
      traffic_light_id: validTrafficLightId,
      plate: plateForFk,
      detected_plate: detectedPlate
    });

    const eventId = eventResult.insertId;

    const extension = path.extname(uploadedFile.originalname || '.jpg') || '.jpg';
    const finalFileName = `iot-ev${eventId}-${Date.now()}${extension}`;
    const finalPath = path.join(evidenceDir, finalFileName);
    fs.renameSync(tempPath, finalPath);

    await createIotEvidence({
      image_path: `/configs/data/evidence/${finalFileName}`,
      event_id: eventId
    });

    let fineId = null;
    if (fineInfo.violation) {
      const fineResult = await createIotFine({
        amount: fineInfo.amount,
        description: fineInfo.description,
        event_id: eventId
      });
      fineId = fineResult?.insertId || null;
    }

    console.log('[IOT] Registrado correctamente:', { eventId, fineId, speed, speedLimit, violation: fineInfo.violation });

    return res.status(201).json({
      estado: true,
      msg: fineInfo.violation ? 'Infracción IoT registrada' : 'Evento IoT registrado sin infracción',
      authenticated_by: req.user,
      event_id: eventId,
      fine_id: fineId,
      speed,
      speed_limit: speedLimit,
      traffic_light_status: trafficLightStatus,
      vehicle_crossed_line: vehicleCrossedLine,
      violation: fineInfo.violation,
      violation_type: violationType || null,
      plate_detected: detectedPlate,
      plate_registered: Boolean(vehicle),
      vehicle,
      evidence: `/configs/data/evidence/${finalFileName}`,
      ocr_error: ocrError
    });
  } catch (error) {
    console.error('[IOT] Error general:', error);

    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return res.status(500).json({
      estado: false,
      error: error.message
    });
  }
};
