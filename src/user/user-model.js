'use strict';

import { db } from '../../configs/mysql.js';

export const getUserByDPI = async (dpi) => {
    const [rows] = await db().query(
        `SELECT u.dpi, u.name, u.username, u.email, u.address, u.estate, u.role_id, r.role AS role_name, u.password
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.dpi = ?
         LIMIT 1`,
        [dpi]
    );
    return rows[0];
};

export const createUser = async (user) => {
    const { dpi, name, username, email, password, address, role_id } = user;

    const [result] = await db().query(
        `INSERT INTO users 
        (dpi, name, username, email, password, address, role_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dpi, name, username, email, password, address, role_id || 4]
    );

    return result;
};

export const getUsers = async () => {
    const [rows] = await db().query(
        `SELECT 
            u.dpi,
            u.name,
            u.username,
            u.email,
            u.address,
            u.estate,
            u.role_id,
            r.role AS role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         ORDER BY u.name ASC`
    );
    return rows;
};

export const getRoles = async () => {
    const [rows] = await db().query(`SELECT id, role FROM roles ORDER BY id ASC`);
    return rows;
};

export const getRoleById = async (roleId) => {
    const [rows] = await db().query(`SELECT id, role FROM roles WHERE id = ? LIMIT 1`, [roleId]);
    return rows[0];
};

export const updateUserRoleDB = async (dpi, roleId) => {
    const [result] = await db().query(`UPDATE users SET role_id = ? WHERE dpi = ?`, [roleId, dpi]);
    return result;
};

export const updateUserDB = async (dpi, data) => {
    const { username, email, address } = data;
    await db().query(
        `UPDATE users SET username = ?, email = ?, address = ? WHERE dpi = ?`,
        [username, email, address, dpi]
    );
};

export const updateUserProfileDB = async (dpi, data) => {
    const { name, username, email, address } = data;
    const [result] = await db().query(
        `UPDATE users
         SET name = COALESCE(?, name),
             username = COALESCE(?, username),
             email = COALESCE(?, email),
             address = COALESCE(?, address)
         WHERE dpi = ?`,
        [name || null, username || null, email || null, address || null, dpi]
    );
    return result;
};

export const updatePasswordDB = async (dpi, newPassword) => {
    const [rows] = await db().query(`SELECT dpi FROM users WHERE dpi = ?`, [dpi]);
    if (rows.length === 0) throw new Error("User not found");
    const [result] = await db().query(`UPDATE users SET password = ? WHERE dpi = ?`, [newPassword, dpi]);
    return result;
};

export const processUserDeathDB = async (dpi) => {
    const connection = await db().getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("UPDATE users SET estate = false WHERE dpi = ?", [dpi]);
        await connection.query("UPDATE vehicles SET dpi_user = NULL WHERE dpi_user = ?", [dpi]);
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
        `SELECT u.*, r.role as role_name FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.dpi = ?`,
        [dpi]
    );
    return rows[0];
};

export const transferVehicleDB = async (plate, newDpi) => {
    const [result] = await db().query("UPDATE vehicles SET dpi_user = ? WHERE plate = ?", [newDpi, plate]);
    return result.affectedRows > 0;
};

export const findUser = async (email, username) => {
    const [rows] = await db().query(
        `SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1`,
        [email || '', username || '']
    );
    return rows[0];
};

export const findUserByEmail = async (email) => {
    const [rows] = await db().query(
        `SELECT * FROM users WHERE email = ? LIMIT 1`,
        [String(email || '').toLowerCase()]
    );
    return rows[0];
};


export const emailBelongsToAnotherUser = async (email, dpi) => {
    const [rows] = await db().query(
        `SELECT dpi FROM users WHERE email = ? AND dpi <> ? LIMIT 1`,
        [String(email || '').toLowerCase(), dpi]
    );
    return rows.length > 0;
};

export const usernameBelongsToAnotherUser = async (username, dpi) => {
    const [rows] = await db().query(
        `SELECT dpi FROM users WHERE username = ? AND dpi <> ? LIMIT 1`,
        [username, dpi]
    );
    return rows.length > 0;
};

export const ensurePasswordResetSchema = async () => {
    const [columns] = await db().query(`SHOW COLUMNS FROM users`);
    const existing = new Set(columns.map((column) => column.Field));

    if (!existing.has('reset_token')) {
        await db().query(`ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL`);
    }

    if (!existing.has('reset_token_expires')) {
        await db().query(`ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL`);
    }
};

export const setResetTokenDB = async ({ dpi, token, expiresAt }) => {
    await ensurePasswordResetSchema();
    const [result] = await db().query(
        `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE dpi = ?`,
        [token, expiresAt, dpi]
    );
    return result;
};

export const findUserByResetToken = async (token) => {
    await ensurePasswordResetSchema();
    const [rows] = await db().query(
        `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1`,
        [token]
    );
    return rows[0];
};

export const clearResetTokenDB = async (dpi) => {
    await ensurePasswordResetSchema();
    await db().query(`UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE dpi = ?`, [dpi]);
};
