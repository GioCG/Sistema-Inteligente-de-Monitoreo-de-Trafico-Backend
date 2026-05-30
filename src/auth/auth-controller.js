'use strict';

import crypto from "crypto";
import bcrypt from "bcrypt";
import { generarJWT } from "../helpers/generate-jwt.js";
import { sendResetPasswordEmail } from "../helpers/email-service.js";
import {
    findUser,
    createUser,
    findUserByEmail,
    setResetTokenDB,
    findUserByResetToken,
    clearResetTokenDB,
    updatePasswordDB
} from "../user/user-model.js";

const publicUserPayload = async (user) => {
    const token = await generarJWT(user.dpi, user.role_id);
    return {
        dpi: user.dpi,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role_id,
        token
    };
};

export const login = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = await findUser(email, username);

        if (!user) return res.status(400).json({ success: false, msg: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ success: false, msg: "Incorrect password" });

        res.status(200).json({ success: true, msg: "Login successful", user: await publicUserPayload(user) });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

export const registerUser = async (req, res) => {
    try {
        const { dpi, name, username, email, password, address, role_id } = req.body;
        const encryptedPassword = await bcrypt.hash(password, 10);

        await createUser({ dpi, name, username, email: email.toLowerCase(), password: encryptedPassword, address, role_id });

        res.status(201).json({ success: true, msg: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Registration failed", error: err.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ estado: false, msg: "El correo es obligatorio" });

        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ estado: false, msg: "Usuario no encontrado con ese correo" });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
        await setResetTokenDB({ dpi: user.dpi, token, expiresAt });
        await sendResetPasswordEmail({ to: user.email, token, username: user.username || user.name });

        return res.status(200).json({ estado: true, msg: "Token de recuperación enviado al correo" });
    } catch (err) {
        console.error("[AUTH] forgotPassword:", err);
        return res.status(500).json({ estado: false, msg: "Error al procesar solicitud", error: err.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const token = req.params.token || req.body.token;
        const password = req.body.password || req.body.newPassword;

        if (!token || !password) return res.status(400).json({ estado: false, msg: "Token y contraseña son obligatorios" });
        if (String(password).length < 8) return res.status(400).json({ estado: false, msg: "La contraseña debe tener al menos 8 caracteres" });

        const user = await findUserByResetToken(token);
        if (!user) return res.status(400).json({ estado: false, msg: "Token no válido o expirado" });

        const hashed = await bcrypt.hash(password, 10);
        await updatePasswordDB(user.dpi, hashed);
        await clearResetTokenDB(user.dpi);

        return res.status(200).json({ estado: true, msg: "Contraseña actualizada con éxito" });
    } catch (err) {
        console.error("[AUTH] resetPassword:", err);
        return res.status(500).json({ estado: false, msg: "Error al cambiar la contraseña", error: err.message });
    }
};

export const logout = async (req, res) => {
    try {
        return res.status(200).json({ estado: true, message: "Logout exitoso" });
    } catch (error) {
        return res.status(500).json({ estado: false, message: "Error en logout" });
    }
};
