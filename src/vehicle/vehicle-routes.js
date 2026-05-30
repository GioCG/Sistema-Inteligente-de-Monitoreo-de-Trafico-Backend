'use strict';
import { Router } from "express";
import { createVehicles, getVehicle, getVehiclesByUsers, listVehicles, deleteVehicles } from "./vehicle-controller.js";
import { vehicleValidator } from "../middlewares/vehicle-validator.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isOperator, isSecurityOrOperator } from "../middlewares/role-validator.js";

const router = Router();

router.get("/",
    validarJWT,
    isSecurityOrOperator,
    listVehicles
);

// Buscar propietario/usuario por placa.
// Ejemplo: GET /traffic-control/v1/vehicles/search/P123ABC
router.get("/search/:plate",
    validarJWT,
    isSecurityOrOperator,
    getVehicle
);

router.get("/user/:dpi",
    validarJWT,
    getVehiclesByUsers
);

router.get("/:plate",
    validarJWT,
    isSecurityOrOperator,
    getVehicle
);

router.post("/",
    validarJWT,
    isOperator,
    vehicleValidator,
    createVehicles
);

router.delete("/:plate",
    validarJWT,
    isOperator,
    deleteVehicles
);

export default router;
