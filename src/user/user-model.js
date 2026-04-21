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
    const { username, email, address } = data;

    await db().query(
        `UPDATE users 
         SET username = ?, email = ?, address = ?
         WHERE dpi = ?`,
        [username, email, address, dpi]
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

export const processUserDeathDB = async (dpi) => {
    const connection = await db().getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            "UPDATE users SET estate = false WHERE dpi = ?",
            [dpi]
        );

        await connection.query(
            "UPDATE vehicles SET dpi_user = NULL WHERE dpi_user = ?",
            [dpi]
        );

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getUserWithRoleName = async (dpi) => {
    const [rows] = await db().query(
        `SELECT u.*, r.role as role_name 
         FROM users u 
         INNER JOIN roles r ON u.role_id = r.id 
         WHERE u.dpi = ?`,
        [dpi]
    );
    return rows[0];
};

export const transferVehicleDB = async (plate, newDpi) => {
    const [result] = await db().query(
        "UPDATE vehicles SET dpi_user = ? WHERE plate = ?",
        [newDpi, plate]
    );
    return result.affectedRows > 0;
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