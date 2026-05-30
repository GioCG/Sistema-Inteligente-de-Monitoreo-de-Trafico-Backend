'use strict';

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { receiveSpeedDetection, iotHealth, iotJsonTest } from './iot-controller.js';
import { validarJWT } from '../middlewares/jwt-validator.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');
const tempDir = path.join(backendRoot, 'configs', 'data', 'evidence', 'tmp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg') || '.jpg';
    cb(null, `iot-temp-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error(`Formato no permitido: ${file.mimetype}. Usa JPG, PNG o WEBP.`));
  }
});

const uploadEvidence = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  console.error('[IOT] Error subiendo imagen:', err.message);
  return res.status(400).json({
    estado: false,
    msg: 'Error subiendo imagen IoT',
    error: err.message
  });
};

// Prueba sin token para verificar que la ruta /iot esté montada.
router.get('/health', iotHealth);

// Prueba con token, pero sin cámara/imagen. Sirve para validar JWT y DB.
router.post('/test-json', validarJWT, iotJsonTest);

// Ruta principal para ESP32-CAM:
// POST /traffic-control/v1/iot/speed-detection
// Headers: x-token: <JWT>
// multipart/form-data: speed, speed_limit, traffic_light_id, traffic_light_status, image
router.post('/speed-detection', validarJWT, uploadEvidence, multerErrorHandler, receiveSpeedDetection);

export default router;
