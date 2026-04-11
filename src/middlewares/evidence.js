import { param, body } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";

export const evidenceValidator = [
    body("event_id")
        .notEmpty().withMessage("El event_id es requerido")
        .isInt({ min: 1 }).withMessage("El event_id debe ser un entero positivo"),
    validarCampos
];