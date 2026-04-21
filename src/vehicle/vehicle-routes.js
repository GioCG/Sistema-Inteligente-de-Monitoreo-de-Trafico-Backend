'use strict';
import { Router } from "express";
import { createVehicles, listVehicles, deleteVehicles } from "./vehicle-controller.js";
import { vehicleValidator } from "../middlewares/vehicle-validator.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isOperator } from "../middlewares/role-validator.js";

const router = Router();

router.get("/",
    validarJWT,
    isOperator,
    listVehicles
);

router.get("/myvehicle",
    validarJWT,
    listVehicles
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