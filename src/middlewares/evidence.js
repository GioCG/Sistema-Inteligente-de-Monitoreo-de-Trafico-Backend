import { body, param } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";

export const evidenceCreateValidator = [
    body("event_id")
        .notEmpty().withMessage("El event_id es requerido")
        .isInt({ min: 1 }).withMessage("El event_id debe ser un entero positivo"),
    validarCampos
];

export const evidenceParamValidator = [
    param("event_id")
        .customSanitizer((value) => String(value || "").replace(/^:/, ""))
        .isInt({ min: 1 }).withMessage("El event_id debe ser un entero positivo"),
    validarCampos
];

export const evidenceDeleteValidator = [
    param("id")
        .customSanitizer((value) => String(value || "").replace(/^:/, ""))
        .isInt({ min: 1 }).withMessage("El id de evidencia debe ser un entero positivo"),
    validarCampos
];

// Compatibilidad con código anterior
export const evidenceValidator = evidenceCreateValidator;
