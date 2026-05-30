'use strict';

import { Router } from 'express';
import { body } from 'express-validator';
import { validarJWT } from '../middlewares/jwt-validator.js';
import { isOperator, isSecurityOrOperator, isSystem } from '../middlewares/role-validator.js';
import { validarCampos } from '../middlewares/validar-campos.js';
import {
  createFine,
  getAllFines,
  getFine,
  getFinesByUserController,
  deleteFine,
  payFine,
  getFineHistoryController,
  createFineClaim,
  listFineClaims,
  resolveFineClaim
} from './fines-controller.js';

const router = Router();

const createFineValidator = [
  body('amount', 'El monto de la multa es obligatorio').not().isEmpty(),
  body('amount', 'El monto debe ser numérico').isNumeric(),
  body('description', 'La descripción es obligatoria').not().isEmpty(),
  body('event_id', 'El event_id es obligatorio').not().isEmpty(),
  body('event_id', 'El event_id debe ser numérico').isNumeric(),
  validarCampos
];

router.post('/', [validarJWT, isSecurityOrOperator, ...createFineValidator], createFine);

router.get('/', validarJWT, isSecurityOrOperator, getAllFines);
router.get('/history', validarJWT, getFineHistoryController);
router.get('/history/user/:dpi', validarJWT, getFineHistoryController);

// Reclamos de multas: ciudadanos crean reclamos; SYSTEM_ROLE/Admin revisa.
router.post('/:id/claim', validarJWT, createFineClaim);
router.get('/claims', validarJWT, listFineClaims);
router.put('/claims/:id/resolve', validarJWT, isSystem, resolveFineClaim);

router.get('/user/:dpi', validarJWT, getFinesByUserController);
router.post('/:id/pay', validarJWT, payFine);
router.get('/:id', validarJWT, isSecurityOrOperator, getFine);
router.delete('/:id', validarJWT, isOperator, deleteFine);

export default router;
