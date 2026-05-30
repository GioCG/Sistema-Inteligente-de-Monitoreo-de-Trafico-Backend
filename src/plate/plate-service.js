'use strict';

import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const normalizeText = (value = '') => String(value)
  .toUpperCase()
  .replace(/[ÁÀÂÄ]/g, 'A')
  .replace(/[ÉÈÊË]/g, 'E')
  .replace(/[ÍÌÎÏ]/g, 'I')
  .replace(/[ÓÒÔÖ]/g, 'O')
  .replace(/[ÚÙÛÜ]/g, 'U')
  .replace(/[^A-Z0-9]/g, '');

export const normalizePlateValue = (value = '') => {
  const cleaned = normalizeText(value).slice(0, 10);
  return cleaned.length >= 4 ? cleaned : null;
};

const getPlateRecognizerEnabled = () => String(process.env.PLATE_RECOGNIZER_ENABLED ?? 'true').toLowerCase() !== 'false';
const getPlateRecognizerRequired = () => String(process.env.PLATE_RECOGNIZER_REQUIRED ?? 'true').toLowerCase() !== 'false';
const getAcceptWithoutDb = () => String(process.env.PLATE_ACCEPT_WITHOUT_DB ?? 'false').toLowerCase() === 'true';
const getMinScore = () => Number(process.env.PLATE_RECOGNIZER_MIN_SCORE || process.env.PLATE_MIN_SCORE || 0.70);
const getDbMatchMinScore = () => Number(process.env.PLATE_DB_MATCH_MIN_SCORE || 80);

const similarGroups = [
  new Set(['0', 'O', 'Q', 'D']),
  new Set(['1', 'I', 'L']),
  new Set(['2', 'Z']),
  new Set(['5', 'S']),
  new Set(['6', 'G']),
  new Set(['8', 'B']),
  new Set(['4', 'A']),
  new Set(['7', 'T'])
];

const areSimilarChars = (a, b) => {
  if (a === b) return true;
  return similarGroups.some((group) => group.has(a) && group.has(b));
};

const weightedDistanceSameLength = (a, b) => {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;

  let distance = 0;
  for (let i = 0; i < left.length; i++) {
    if (left[i] === right[i]) continue;
    distance += areSimilarChars(left[i], right[i]) ? 0.35 : 1;
  }
  return distance;
};

const bestWindowScore = (needlePlate, haystackText) => {
  const plate = normalizeText(needlePlate);
  const text = normalizeText(haystackText);

  if (!plate || !text) return 0;
  if (text.includes(plate)) return 100;
  if (text.length < plate.length) return 0;

  let best = 0;
  for (let i = 0; i <= text.length - plate.length; i++) {
    const part = text.slice(i, i + plate.length);
    const distance = weightedDistanceSameLength(plate, part);
    const score = Math.max(0, 100 - (distance / plate.length) * 100);
    if (score > best) best = score;
  }
  return best;
};

const plateRecognizerRegions = () => String(process.env.PLATE_RECOGNIZER_REGIONS || '')
  .split(',')
  .map((region) => region.trim().toLowerCase())
  .filter(Boolean);

const readPlateRecognizerResult = (data = {}) => {
  const results = Array.isArray(data.results) ? data.results : [];
  const minScore = getMinScore();
  const details = [];

  for (const item of results) {
    const plate = normalizePlateValue(item.plate || item.plate_number || '');
    if (!plate) continue;

    const score = Number(item.score || item.confidence || 0);
    const dscore = Number(item.dscore || 0);
    const region = item.region?.code || item.region || null;
    const vehicle = item.vehicle || null;
    const box = item.box || null;

    details.push({
      plate,
      score,
      dscore,
      region,
      vehicle,
      box,
      accepted: score >= minScore,
      provider: 'plate_recognizer'
    });
  }

  details.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  const accepted = details.find((item) => item.accepted) || null;

  return {
    plate: accepted?.plate || null,
    provider: 'plate_recognizer',
    raw_text: JSON.stringify(data),
    candidates: details.map((item) => item.plate),
    candidate_details: details,
    api_raw: data,
    min_score: minScore
  };
};

const detectPlateWithPlateRecognizer = async (imagePath) => {
  if (!getPlateRecognizerEnabled()) {
    return {
      plate: null,
      provider: 'plate_recognizer_disabled',
      raw_text: '',
      candidates: [],
      candidate_details: [],
      errors: ['Plate Recognizer está deshabilitado por PLATE_RECOGNIZER_ENABLED=false']
    };
  }

  const token = process.env.PLATE_RECOGNIZER_TOKEN;
  if (!token) {
    throw new Error('PLATE_RECOGNIZER_TOKEN no está configurado en .env');
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagen no encontrada: ${imagePath}`);
  }

  const form = new FormData();
  form.append('upload', fs.createReadStream(imagePath));

  for (const region of plateRecognizerRegions()) {
    form.append('regions', region);
  }

  const url = process.env.PLATE_RECOGNIZER_URL || 'https://api.platerecognizer.com/v1/plate-reader/';
  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Token ${token}`
    },
    timeout: Number(process.env.PLATE_RECOGNIZER_TIMEOUT_MS || 30000),
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  const result = readPlateRecognizerResult(response.data || {});

  console.log('================ ALPR API ================');
  console.log('[ALPR] Proveedor: Plate Recognizer');
  console.log(`[ALPR] URL: ${url}`);
  console.log(`[ALPR] Regiones: ${plateRecognizerRegions().join(', ') || 'sin filtro'}`);
  console.log(`[ALPR] Placa mejor candidata: ${result.plate || 'NO DETECTADA'}`);
  console.log(`[ALPR] Candidatos: ${result.candidates.join(', ') || 'ninguno'}`);
  if (result.candidate_details?.length) console.log(`[ALPR] Detalles: ${JSON.stringify(result.candidate_details.slice(0, 5))}`);
  console.log('==========================================');

  return result;
};

export const detectPlateFromImageDetailed = async (imagePath) => {
  const base = {
    plate: null,
    provider: null,
    raw_text: '',
    candidates: [],
    candidate_details: [],
    errors: []
  };

  try {
    const result = await detectPlateWithPlateRecognizer(imagePath);
    return {
      ...base,
      ...result,
      errors: [...(result.errors || [])]
    };
  } catch (error) {
    console.error('[ALPR] Error usando API de placas:', error.message);

    if (getPlateRecognizerRequired()) {
      return {
        ...base,
        provider: 'plate_recognizer_error',
        errors: [error.message]
      };
    }

    // No existe fallback local. Se deja el resultado vacío para evitar placas inventadas.
    return {
      ...base,
      provider: 'no_local_ocr_configured',
      errors: [error.message, 'OCR local fue eliminado; configura una API ALPR en .env.']
    };
  }
};

export const detectPlateFromImage = async (imagePath) => {
  const result = await detectPlateFromImageDetailed(imagePath);
  return result.plate;
};

export const matchOcrToRegisteredVehicle = (ocr = {}, registeredVehicles = []) => {
  const candidates = Array.isArray(ocr.candidates) ? ocr.candidates : [];
  const details = Array.isArray(ocr.candidate_details) ? ocr.candidate_details : [];
  const rawText = String(ocr.raw_text || '');
  const combinedText = [rawText, ocr.plate, ...candidates, ...details.map((d) => d.plate || '')].filter(Boolean).join(' ');

  let best = null;

  for (const vehicle of registeredVehicles) {
    const registeredPlate = normalizePlateValue(vehicle?.plate);
    if (!registeredPlate) continue;

    let score = bestWindowScore(registeredPlate, combinedText);
    let source = 'api_raw_match';

    for (const detail of details) {
      const candidateScore = bestWindowScore(registeredPlate, detail.plate);
      const apiScore = Number(detail.score || 0) * 100;
      const finalScore = Math.max(candidateScore, detail.plate === registeredPlate ? apiScore : candidateScore);

      if (finalScore > score) {
        score = finalScore;
        source = 'api_candidate';
      }
    }

    if (normalizePlateValue(ocr.plate) === registeredPlate) {
      score = Math.max(score, 100);
      source = 'api_exact_plate';
    }

    if (!best || score > best.score) {
      best = { plate: registeredPlate, score, source, vehicle };
    }
  }

  const threshold = getDbMatchMinScore();

  if (!best || best.score < threshold) {
    return {
      matched: false,
      plate: null,
      score: best?.score || 0,
      source: best?.source || null,
      vehicle: null,
      threshold
    };
  }

  return {
    matched: true,
    plate: best.plate,
    score: best.score,
    source: best.source,
    vehicle: best.vehicle,
    threshold
  };
};

export const shouldAcceptOcrPlateWithoutDb = () => getAcceptWithoutDb();

export const extractPlateCandidates = (ocrText = '') => {
  const plate = normalizePlateValue(ocrText);
  return plate ? [plate] : [];
};

export const extractPlateCandidatesDetailed = (ocrText = '') => {
  const plate = normalizePlateValue(ocrText);
  return plate ? [{ plate, score: 100 }] : [];
};
