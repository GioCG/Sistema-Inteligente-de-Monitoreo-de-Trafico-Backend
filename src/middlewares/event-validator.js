'use strict';
import { param } from "express-validator";
import { body } from "express-validator";
import { validarCampos } from "./validar-campos.js";

export const eventValidator = [
    body("speed")
        .isFloat({ min: 0 })
        .withMessage("La velocidad debe ser un número positivo"),

    body("traffic_light_id")
        .isInt()
        .withMessage("El ID del semáforo debe ser un número entero"),

    body("plate")
        .notEmpty()
        .withMessage("La placa es obligatoria"),

    body("violation")
        .isBoolean()
        .withMessage("Violation debe ser booleano"),

    validarCampos
];

export const getEventsByUserValidator = [
    param("dpi")
        .isLength({ min: 13, max: 13 })
        .withMessage("el dpi no existe")
        .isNumeric(),
    validarCampos
];



