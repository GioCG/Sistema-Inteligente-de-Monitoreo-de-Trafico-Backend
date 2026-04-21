import { validarCampos } from "../middlewares/validar-campos.js";
import { param, body } from "express-validator";

export const vehicleValidator = [
    body("plate", "Plate is required")
        .not().isEmpty()
        .isLength({ min: 6, max: 10 }),

    body("type").not().isEmpty(),
    body("color").not().isEmpty(),

    body("dpi_user")
        .isNumeric()
        .isLength({ min: 13, max: 13 }),

    validarCampos
];