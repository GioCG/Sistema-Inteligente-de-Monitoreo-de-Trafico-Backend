'use strict';
import { body, param, query } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";

const TIPOS_VALIDOS = ["automovil", "motocicleta", "camion", "bus", "pickup"];

export const requestRegisterVehicleValidator = [
    body("plate")
        .notEmpty().withMessage("La placa es requerida")
        .isLength({ min: 6, max: 10 }).withMessage("Placa inválida")
        .matches(/^[A-Z0-9]+$/).withMessage("La placa solo puede contener letras mayúsculas y números"),

    body("type")
        .notEmpty().withMessage("El tipo es requerido")
        .isIn(TIPOS_VALIDOS).withMessage(`Tipo inválido. Permitidos: ${TIPOS_VALIDOS.join(", ")}`),

    body("color")
        .notEmpty().withMessage("El color es requerido")
        .isLength({ max: 20 }).withMessage("Color demasiado largo"),

    validarCampos
];

export const requestClaimVehicleValidator = [
    body("plate")
        .notEmpty().withMessage("La placa es requerida")
        .isLength({ min: 6, max: 10 }).withMessage("Placa inválida"),

    validarCampos
];

export const resolveRequestValidator = [
    param("id")
        .isInt({ min: 1 }).withMessage("ID de solicitud inválido"),

    body("action")
        .notEmpty().withMessage("La acción es requerida")
        .isIn(["APPROVED", "REJECTED"]).withMessage("Acción inválida. Use APPROVED o REJECTED"),

    body("reason")
        .if(body("action").equals("REJECTED"))
        .notEmpty().withMessage("Debes indicar el motivo del rechazo"),

    validarCampos
];

export const listRequestsValidator = [
    query("status")
        .optional()
        .isIn(["PENDING", "APPROVED", "REJECTED"]).withMessage("Status inválido"),

    validarCampos
];