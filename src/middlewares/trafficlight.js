import { body } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";

export const trafficLightValidator = [
    body("location").notEmpty().withMessage("La ubicación es requerida"),
    body("status")
        .notEmpty()
        .isIn(["Activo", "Inactivo"])
        .withMessage("El estado debe ser Activo o Inactivo"),
    validarCampos
];