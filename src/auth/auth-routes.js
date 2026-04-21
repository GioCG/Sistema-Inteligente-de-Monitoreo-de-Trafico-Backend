'use strict';

import { Router } from 'express';
import {
    loginValidator,
    registerUserValidator
} from "../middlewares/user-validator.js";

import {
    login,
    registerUser
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

export default router;