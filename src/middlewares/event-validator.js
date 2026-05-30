'use strict';
import { param, body } from "express-validator";
import { validarCampos } from "./validar-campos.js";

export const eventValidator = [
    body("speed")
        .notEmpty().withMessage("La velocidad es obligatoria")
        .isFloat({ min: 0 }).withMessage("La velocidad debe ser un número positivo"),

    // Si el frontend no envía traffic_light_id, el controller usará 1 por defecto.
    body("traffic_light_id")
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1 }).withMessage("El ID del semáforo debe ser un número entero"),

    body("plate")
        .notEmpty().withMessage("La placa es obligatoria")
        .isLength({ min: 6, max: 10 }).withMessage("La placa debe tener entre 6 y 10 caracteres")
        .matches(/^[A-Za-z0-9]+$/).withMessage("La placa solo puede contener letras y números"),

    body("traffic_light_status")
        .optional({ nullable: true, checkFalsy: true })
        .isIn(["GREEN", "YELLOW", "RED", "VERDE", "AMARILLO", "ROJO", "NO_APLICA", "N/A", "MANUAL"]).withMessage("Estado del semáforo inválido"),

    validarCampos
];

export const getEventsByUserValidator = [
    param("dpi")
        .isLength({ min: 13, max: 13 })
        .withMessage("el dpi no existe")
        .isNumeric(),
    validarCampos
];
