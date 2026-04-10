'use strict';
import { db } from '../../configs/mysql.js';

export const createVehicle = async (data) => {
    const { plate, type, color, dpi_user } = data;

    await db().query(
        "CALL sp_createVehicle(?, ?, ?, ?)",
        [plate, type, color, dpi_user]
    );
};

export const getVehicles = async () => {
    const [rows] = await db().query("CALL sp_getVehicles()");
    return rows[0];
};

export const deleteVehicle = async (plate) => {
    await db().query("DELETE FROM vehicles WHERE plate = ?", [plate]);
};

export const getVehicleByPlate = async (plate) => {
    const [rows] = await db().query(
        "SELECT * FROM vehicles WHERE plate = ?",
        [plate]
    );
    return rows.length > 0 ? rows[0] : null;
};

