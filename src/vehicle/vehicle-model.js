'use strict';
import { db } from '../../configs/mysql.js';

export const createVehicle = async (data) => {
    const { plate, type, color, dpi_user } = data;

    await db().query(
        "CALL sp_createVehicle(?, ?, ?, ?)",
        [plate, type, color, dpi_user]
    );
};

export const getVehiclesByUser = async (dpi) => {
    const [rows] = await db().query(
        `SELECT v.plate, v.type, v.color, v.dpi_user,
                u.name AS owner_name,
                u.username AS owner_username,
                u.email AS owner_email,
                u.address AS owner_address
         FROM vehicles v
         LEFT JOIN users u ON v.dpi_user = u.dpi
         WHERE v.dpi_user = ?`,
        [dpi]
    );
    return rows;
};

export const deleteVehicle = async (plate) => {
    await db().query("DELETE FROM vehicles WHERE plate = ?", [plate]);
};

export const getVehicleByPlate = async (plate) => {
    const [rows] = await db().query(
        `SELECT v.plate, v.type, v.color, v.dpi_user,
                u.name AS owner_name,
                u.username AS owner_username,
                u.email AS owner_email,
                u.address AS owner_address,
                u.role_id AS owner_role_id
         FROM vehicles v
         LEFT JOIN users u ON v.dpi_user = u.dpi
         WHERE v.plate = ?
         LIMIT 1`,
        [plate]
    );
    return rows.length > 0 ? rows[0] : null;
};

export const getAllVehicles = async () => {
    const [rows] = await db().query(
        `SELECT v.plate, v.type, v.color, v.dpi_user,
                u.name AS owner_name,
                u.username AS owner_username,
                u.email AS owner_email,
                u.address AS owner_address
         FROM vehicles v
         LEFT JOIN users u ON v.dpi_user = u.dpi
         ORDER BY v.plate ASC`
    );
    return rows;
};
