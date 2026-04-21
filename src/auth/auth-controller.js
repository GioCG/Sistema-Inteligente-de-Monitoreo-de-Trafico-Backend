'use strict';

import bcrypt from "bcrypt";
import { generarJWT } from "../helpers/generate-jwt.js";
import { findUser, createUser } from "../user/user-model.js";

export const login = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        const user = await findUser(email, username);

        if (!user) {
            return res.status(400).json({
                success: false,
                msg: "User not found"
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: "Incorrect password"
            });
        }

        const token = await generarJWT(user.dpi, user.role_id);

        res.status(200).json({
            success: true,
            msg: "Login successful",
            user: {
                dpi: user.dpi,
                name: user.name,
                role: user.role_id,
                token
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            msg: "Server error",
            error: err.message
        });
    }
};

export const registerUser = async (req, res) => {
    try {
        const {
            dpi,
            name,
            username,
            email,
            password,
            address,
            role_id
        } = req.body;

        const encryptedPassword = await bcrypt.hash(password, 10);

        await createUser({
            dpi,
            name,
            username,
            email: email.toLowerCase(),
            password: encryptedPassword,
            address,
            role_id
        });

        res.status(201).json({
            success: true,
            msg: "User registered successfully"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            msg: "Registration failed",
            error: err.message
        });
    }
};