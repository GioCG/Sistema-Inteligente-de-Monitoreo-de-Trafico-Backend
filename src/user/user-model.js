'use strict';

import { db } from '../../configs/mysql.js';

export const getUserByDPI = async (dpi) => {
    const [rows] = await db().query(
        "SELECT * FROM users WHERE dpi = ?",
        [dpi]
    );
    return rows[0];
};

export const createUser = async (user) => {
    const {
        dpi,
        name,
        username,
        email,
        password,
        address,
        role_id
    } = user;

    const [result] = await db().query(
        `INSERT INTO users 
        (dpi, name, username, email, password, address, role_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dpi, name, username, email, password, address, role_id || 4, true]
    );

    return result;
};

export const getUsers = async () => {
    const [rows] = await db().query(
        "SELECT * FROM users "
    );
    return rows;
};

export const updateUserDB = async (dpi, data) => {
    const { name, username, address } = data;

    await db().query(
        `UPDATE users 
         SET name = ?, username = ?, address = ?
         WHERE dpi = ?`,
        [name, username, address, dpi]
    );
};

export const updatePasswordDB = async (dpi, newPassword) => {
    const [rows] = await db().query(
        `SELECT dpi FROM users WHERE dpi = ?`,
        [dpi]
    );

    if (rows.length === 0) {
        throw new Error("User not found");
    }

    const [result] = await db().query(
        `UPDATE users 
         SET password = ? 
         WHERE dpi = ?`,
        [newPassword, dpi]
    );

    return result;
};

export const deleteUserDB = async (dpi) => {
    await db().query(
        "UPDATE users SET estado = false WHERE dpi = ?",
        [dpi]
    );
};

export const findUser = async (email, username) => {
    const [rows] = await db().query(
        `SELECT * FROM users 
         WHERE email = ? OR username = ?
         LIMIT 1`,
        [email, username]
    );
    return rows[0];
};