'use strict';

import fs from 'fs';
import path from 'path';
import { detectPlateFromImageDetailed, normalizePlateValue, matchOcrToRegisteredVehicle, shouldAcceptOcrPlateWithoutDb } from './plate-service.js';
import { getVehicleByPlate, getAllVehicles } from '../vehicle/vehicle-model.js';

const DATA_DIRS = {
  image: path.resolve(process.cwd(), 'configs/data/image'),
  evidence: path.resolve(process.cwd(), 'configs/data/evidence')
};

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const ensureDataDirs = () => {
  for (const dir of Object.values(DATA_DIRS)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
};

const resolveSource = (source = 'image') => {
  const cleanSource = String(source || 'image').trim().toLowerCase();
  return DATA_DIRS[cleanSource] ? cleanSource : 'image';
};

const resolveSavedImagePath = ({ filename, image_path, source = 'image' }) => {
  ensureDataDirs();

  const selectedSource = resolveSource(source);
  const baseDir = DATA_DIRS[selectedSource];
  const input = filename || image_path;

  if (!input) {
    throw new Error('Debes enviar filename o image_path.');
  }

  // Evita path traversal: solo usamos el nombre del archivo.
  const safeName = path.basename(String(input).replace(/\\/g, '/'));
  const ext = path.extname(safeName).toLowerCase();

  if (!allowedExtensions.has(ext)) {
    throw new Error('Formato no permitido. Usa JPG, JPEG, PNG o WEBP.');
  }

  const finalPath = path.join(baseDir, safeName);

  if (!finalPath.startsWith(baseDir)) {
    throw new Error('Ruta inválida.');
  }

  return {
    source: selectedSource,
    fileName: safeName,
    imagePath: finalPath,
    publicPath: `/configs/data/${selectedSource}/${safeName}`
  };
};

const buildPlateResponse = async ({ imagePath, publicPath = null }) => {
  const ocr = await detectPlateFromImageDetailed(imagePath);
  const ocrDetectedPlate = normalizePlateValue(ocr.plate);

  // Modo más seguro: no confiar en cualquier texto que invente OCR.
  // Se compara el OCR contra las placas registradas en vehicles y solo se acepta si hay match fuerte.
  const registeredVehicles = await getAllVehicles();
  const dbMatch = matchOcrToRegisteredVehicle(ocr, registeredVehicles);

  let detectedPlate = null;
  let vehicle = null;
  let matchSource = dbMatch.source;
  let matchScore = dbMatch.score;

  if (dbMatch.matched) {
    detectedPlate = dbMatch.plate;
    vehicle = dbMatch.vehicle;
  } else if (shouldAcceptOcrPlateWithoutDb() && ocrDetectedPlate) {
    detectedPlate = ocrDetectedPlate;
    vehicle = await getVehicleByPlate(detectedPlate);
    matchSource = 'ocr_without_db';
    matchScore = 0;
  }

  console.log('================ OCR PLACA ================');
  console.log(`[OCR] Imagen recibida: ${publicPath || imagePath}`);
  console.log(`[OCR] Proveedor: ${ocr.provider || 'sin proveedor'}`);
  console.log(`[OCR] Placas registradas en DB: ${registeredVehicles.length}`);
  console.log(`[OCR] Candidatos OCR crudos: ${(ocr.candidates || []).join(', ') || 'ninguno'}`);
  console.log(`[OCR] OCR candidato principal sin validar: ${ocrDetectedPlate || 'NO DETECTADA'}`);
  console.log(`[OCR] Match contra DB: ${dbMatch.matched ? 'SI' : 'NO'} | score=${Number(matchScore || 0).toFixed(1)} | fuente=${matchSource || 'n/a'} | minimo=${dbMatch.threshold}`);
  console.log(`[OCR] PLACA FINAL ACEPTADA: ${detectedPlate || 'NO ACEPTADA'}`);
  console.log(`[OCR] Vehículo encontrado en DB: ${vehicle ? 'SI' : 'NO'}`);
  if (vehicle) console.log(`[OCR] Vehículo: ${vehicle.plate} | ${vehicle.type} | ${vehicle.color} | DPI: ${vehicle.dpi_user}`);
  if (ocr.candidate_details?.length) console.log(`[OCR] Detalles candidatos: ${JSON.stringify(ocr.candidate_details.slice(0, 8))}`);
  if (ocr.raw_text) console.log(`[OCR] Texto crudo: ${String(ocr.raw_text).replace(/\s+/g, ' ').trim().slice(0, 1500)}`);
  if (ocr.errors?.length) console.log(`[OCR] Errores: ${ocr.errors.join(' | ')}`);
  console.log('===========================================');

  return {
    plate_detected: detectedPlate,
    vehicle_found: Boolean(vehicle),
    vehicle,
    image_path: publicPath,
    ocr_provider: ocr.provider,
    ocr_candidates: ocr.candidates,
    ocr_candidate_details: ocr.candidate_details,
    ocr_raw_text: ocr.raw_text,
    ocr_errors: ocr.errors,
    ocr_candidate_unvalidated: ocrDetectedPlate,
    db_match_score: matchScore,
    db_match_source: matchSource,
    db_match_threshold: dbMatch.threshold
  };
};

export const detectPlate = async (req, res) => {
  const tempPath = req.file?.path;

  try {
    if (!tempPath) {
      return res.status(400).json({
        estado: false,
        msg: 'Falta la imagen. Envía el campo image como multipart/form-data.'
      });
    }

    // Permite prueba manual enviando plate en el body mientras ajustas OCR.
    const manualPlate = normalizePlateValue(req.body?.plate);

    if (manualPlate) {
      const vehicle = await getVehicleByPlate(manualPlate);
      console.log('================ OCR PLACA ================');
      console.log(`[OCR] PLACA ENVIADA MANUALMENTE: ${manualPlate}`);
      console.log(`[OCR] Vehículo encontrado en DB: ${vehicle ? 'SI' : 'NO'}`);
      console.log('===========================================');
      return res.status(200).json({
        estado: true,
        plate_detected: manualPlate,
        vehicle_found: Boolean(vehicle),
        vehicle,
        source: 'manual_body'
      });
    }

    const data = await buildPlateResponse({ imagePath: tempPath });

    return res.status(200).json({
      estado: true,
      ...data
    });
  } catch (error) {
    return res.status(500).json({
      estado: false,
      error: error.message
    });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
};

export const detectSavedPlate = async (req, res) => {
  try {
    const { source, fileName, imagePath, publicPath } = resolveSavedImagePath({
      filename: req.body?.filename || req.query?.filename,
      image_path: req.body?.image_path || req.query?.image_path,
      source: req.body?.source || req.query?.source || 'image'
    });

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        estado: false,
        msg: `No existe la imagen ${fileName} en configs/data/${source}`
      });
    }

    const data = await buildPlateResponse({ imagePath, publicPath });

    return res.status(200).json({
      estado: true,
      source,
      filename: fileName,
      ...data
    });
  } catch (error) {
    return res.status(400).json({
      estado: false,
      error: error.message
    });
  }
};

export const scanSavedImages = async (req, res) => {
  try {
    ensureDataDirs();

    const source = resolveSource(req.query?.source || req.body?.source || 'image');
    const baseDir = DATA_DIRS[source];
    const limit = Math.min(Number(req.query?.limit || req.body?.limit || 25), 100);

    const files = fs.readdirSync(baseDir)
      .filter((file) => allowedExtensions.has(path.extname(file).toLowerCase()))
      .slice(0, limit);

    const results = [];

    for (const file of files) {
      const imagePath = path.join(baseDir, file);
      const publicPath = `/configs/data/${source}/${file}`;

      try {
        const data = await buildPlateResponse({ imagePath, publicPath });
        results.push({
          estado: true,
          filename: file,
          ...data
        });
      } catch (error) {
        results.push({
          estado: false,
          filename: file,
          image_path: publicPath,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      estado: true,
      source,
      total: results.length,
      results
    });
  } catch (error) {
    return res.status(500).json({
      estado: false,
      error: error.message
    });
  }
};
