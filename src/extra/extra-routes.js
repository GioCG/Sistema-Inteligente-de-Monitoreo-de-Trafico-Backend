'use strict';
import { 
    Router 
} from "express";
import { 
    claimVehicle, 
    desactivateByDeath,
    updateUserRole
} from "./extra-cotroller.js";
import { 
    deleteUserValidator
} from "../middlewares/user-validator.js";
import {
     validarJWT 
} from "../middlewares/jwt-validator.js";
import {
    isAdmin
} from "../middlewares/role-validator.js"
import { 
    isOperator 
} from "../middlewares/role-validator.js";

const router = Router();

router.put("/claim",
    validarJWT,
    isOperator,
    claimVehicle
);

router.delete("/:dpi",
    validarJWT,
    isOperator,
    deleteUserValidator,
    desactivateByDeath
);

router.put(
    "/role/:dpi",
    [
        validarJWT,
        isAdmin
    ],
    updateUserRole
);

export default router;