'use strict';
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isOperator } from "../middlewares/role-validator.js";
import { Router } from "express";
import {
    getAllFines,
    getFine,
    deleteFine
} from "./fines-controller.js";

const router = Router();

router.get("/", 
    validarJWT,
    isOperator,
    getAllFines);

router.get("/:id", 
    validarJWT,
    isOperator,
    getFine);

router.delete("/:id", 
    validarJWT,
    isOperator,
    deleteFine);

export default router;