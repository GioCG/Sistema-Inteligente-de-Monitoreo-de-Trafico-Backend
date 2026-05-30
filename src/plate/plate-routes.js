'use strict';

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { detectPlate, detectSavedPlate, scanSavedImages } from './plate-controller.js';
import { validarJWT } from '../middlewares/jwt-validator.js';

const router = Router();
const tempDir = './configs/data/image/tmp';

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => cb(null, `plate-temp-${Date.now()}${path.extname(file.originalname || '.jpg')}`)
});

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
});

// Requiere token JWT en header x-token.
// POST /traffic-control/v1/plates/detect con multipart/form-data campo image.
router.post('/detect', validarJWT, upload.single('image'), detectPlate);

// Detecta placa desde una imagen ya guardada en configs/data/image.
// GET  /traffic-control/v1/plates/detect-saved?filename=carro.jpg
// POST /traffic-control/v1/plates/detect-saved { "filename": "carro.jpg" }
router.get('/detect-saved', validarJWT, detectSavedPlate);
router.post('/detect-saved', validarJWT, detectSavedPlate);

// Escanea varias imágenes guardadas en configs/data/image.
// GET /traffic-control/v1/plates/scan-saved?limit=25
router.get('/scan-saved', validarJWT, scanSavedImages);
router.post('/scan-saved', validarJWT, scanSavedImages);

export default router;
