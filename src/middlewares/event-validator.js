export const eventValidator = [
    body("speed").isFloat({ min: 0 }),
    body("traffic_light_id").isInt(),
    body("plate").not().isEmpty(),
    body("violation").isBoolean(),

    validarCampos
];