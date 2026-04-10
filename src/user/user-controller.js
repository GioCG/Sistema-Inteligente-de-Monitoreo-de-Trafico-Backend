'use strict';

import {
    getUsers,
    getUserByDPI,
    updateUserDB,
    updatePasswordDB
} from './user-model.js';

import bcrypt from 'bcrypt';

export const listUser = async (req, res) => {
    try {
        const users = await getUsers();

        res.status(200).json({
            estado: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            estado: false,
            msg: "Error al obtener usuarios",
            error: error.message
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const { dpi } = req.params;

        const user = await getUserByDPI(dpi);

        if (!user) {
            return res.status(404).json({
                estado: false,
                msg: "Usuario no encontrado"
            });
        }

        res.status(200).json({
            estado: true,
            user
        });

    } catch (error) {
        res.status(500).json({
            estado: false,
            msg: "Error al obtener usuario",
            error: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { dpi } = req.params;

        await updateUserDB(dpi, req.body);

        res.status(200).json({
            estado: true,
            msg: "Usuario actualizado"
        });

    } catch (error) {
        res.status(500).json({
            estado: false,
            msg: "Error al actualizar usuario",
            error: error.message
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { dpi } = req.params;
        const { currentPassword, newPassword } = req.body;

        const user = await getUserByDPI(dpi);

        const valid = await bcrypt.compare(currentPassword, user.password);

        if (!valid) {
            return res.status(400).json({
                estado: false,
                msg: "Contraseña incorrecta"
            });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await updatePasswordDB(dpi, hashed);

        res.status(200).json({
            estado: true,
            msg: "Contraseña actualizada"
        });

    } catch (error) {
        res.status(500).json({
            estado: false,
            msg: "Error al actualizar contraseña",
            error: error.message
        });
    }
};

