'use strict';

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getUserByDPI } from "../user/user-model.js";
import { body, param } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";
import { existenteEmail, existeUsuarioByDPI } from "../helpers/db-validator.js";
import rateLimit from 'express-rate-limit';

export const userExists = async (req, res, next) => {
    try {
        const { dpi } = req.params;

        const user = await getUserByDPI(dpi);

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Usuario no existe"
            });
        }

        req.userDB = user;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error validando usuario"
        });
    }
};


export const validatePassword = async (req, res, next) => {
    try {
        const { password, currentPassword } = req.body;
        const user = req.userDB;

        const pass = password || currentPassword;

        const valid = await bcrypt.compare(pass, user.password);

        if (!valid) {
            return res.status(400).json({
                success: false,
                msg: "Contraseña incorrecta"
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error validando contraseña"
        });
    }
};

export const isSameUser = (req, res, next) => {
    const token = req.header("x-token");

    if (!token) {
        return res.status(401).json({
            success: false,
            msg: "Token no proporcionado"
        });
    }

    try {
        const { udpi, role } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

        req.user = { udpi, role };

        const paramDpi = req.params.dpi;

        if (udpi != paramDpi) {
            return res.status(403).json({
                success: false,
                msg: "No puedes modificar datos de otro usuario"
            });
        }

        next();

    } catch (err) {
        return res.status(401).json({
            success: false,
            msg: "Token inválido"
        });
    }
};

export const registerUserValidator = [
    body("dpi").isLength({ min: 13, max: 13 }),
    body("name").notEmpty(),
    body("username").isLength({ min: 4 }),
    body("email").isEmail(),
    body("email").custom(existenteEmail),
    body("password").isLength({ min: 8 }),
    body("address").notEmpty(),
    validarCampos
];

export const updateUserValidator = [
    param("dpi").custom(existeUsuarioByDPI),
    validarCampos
];

export const updatePasswordValidator = [
    param("dpi").custom(existeUsuarioByDPI),
    body("newPassword").isLength({ min: 8 }),
    validarCampos
];

export const deleteUserValidator = [
    param("dpi").custom(existeUsuarioByDPI),
    validarCampos
];

export const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        msg: "Too many login attempts"
    }
});

export const loginValidator = [

    body("email")
        .optional()
        .isEmail()
        .withMessage("Enter a valid email"),

    body("username")
        .optional()
        .isString(),

    body("password", "Password is required")
        .isLength({ min: 8 }),

    validarCampos
];