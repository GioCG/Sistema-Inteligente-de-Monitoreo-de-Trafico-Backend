'use strict';

import { db } from '../../configs/mysql.js';

export const createFineDB = async (fine) => {
    const { amount, description, event_id } = fine;

    const [result] = await db().query(
        `INSERT INTO fines (amount, description, event_id)
         VALUES (?, ?, ?)`,
        [amount, description, event_id]
    );

    return result;
};

export const getFines = async () => {
    const [rows] = await db().query(`
        SELECT f.*, e.speed, e.violation, v.plate, u.name
        FROM fines f
        JOIN events e ON f.event_id = e.id
        JOIN vehicles v ON e.plate = v.plate
        JOIN users u ON v.dpi_user = u.dpi
    `);
    return rows;
};

export const getFineById = async (id) => {
    const [rows] = await db().query(
        `SELECT * FROM fines WHERE id = ?`,
        [id]
    );
    return rows[0];
};

export const deleteFineDB = async (id) => {
    await db().query(
        `DELETE FROM fines WHERE id = ?`,
        [id]
    );
};