'use strict';

import { Router } from 'express';
import {
    loginValidator,
    registerUserValidator
} from "../middlewares/user-validator.js";
import{
    validarJWT
}from "../middlewares/jwt-validator.js"
import {
    login,
    registerUser,
    logout
} from "./auth-controller.js";

import { deleteFileOnError } from "../middlewares/delete-file-on-error.js";

const router = Router();

router.post(
    '/login',
    [
        loginValidator
    ],
    login
);

router.post(
    '/register',
    [
        registerUserValidator
    ],
    registerUser
);

router.post("/logout", 
    [
        validarJWT
    ], 
    logout
);

export default router;