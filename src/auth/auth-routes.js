'use strict';

import { Router } from 'express';
import { body } from 'express-validator';
import { loginValidator, registerUserValidator } from "../middlewares/user-validator.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { login, registerUser, logout, forgotPassword, resetPassword } from "./auth-controller.js";

const router = Router();

router.post('/login', loginValidator, login);
router.post('/register', registerUserValidator, registerUser);

router.post('/forgot-password',
    [body('email', 'Correo inválido').isEmail(), validarCampos],
    forgotPassword
);

router.post('/reset-password',
    [
        body('token', 'Token obligatorio').notEmpty(),
        body('password', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
        validarCampos
    ],
    resetPassword
);

router.post('/reset-password/:token',
    [body('password', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }), validarCampos],
    resetPassword
);


router.post('/logout', [validarJWT], logout);

export default router;
