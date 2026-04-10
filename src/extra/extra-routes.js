'use strict';
import { Router } from "express";
import {
    claimVehicle,
    desactivateByDeath
} from "./extra-cotroller.js";

import {
    deleteUserValidator
  } from "../middlewares/user-validator.js";

import {
    validarJWT
    }from  "../middlewares/jwt-validator.js"

import {isOperator }from "../middlewares/role-validator.js"

const router = Router();

router.put(
    "/claim",
    validarJWT,
    isOperator,
    claimVehicle
);

router.delete(
    "/:dpi",
    validarJWT,
    isOperator,
    deleteUserValidator,
    desactivateByDeath
);


export default router;