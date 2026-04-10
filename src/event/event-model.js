'use strict';
import { db } from '../../configs/mysql.js';

export const createEvent = async (data) => {
    const {
        speed,
        date,
        traffic_light_status,
        violation,
        traffic_light_id,
        plate
    } = data;

    await db().query(
        "CALL sp_createEvent(?, ?, ?, ?, ?, ?)",
        [speed, date, traffic_light_status, violation, traffic_light_id, plate]
    );
};

export const getEvents = async () => {
    const [rows] = await db().query("CALL sp_getEvents()");
    return rows[0];
};

export const getEventsByUserDB = async (dpi) => {
    const [rows] = await db().query(
        `SELECT 
            e.id,
            e.speed,
            e.date,
            e.traffic_light_status,
            e.violation,
            e.plate,
            tl.location AS traffic_light_location,
            tl.status AS traffic_light_current_status
        FROM events e
        INNER JOIN vehicles v ON e.plate = v.plate
        INNER JOIN users u ON v.dpi_user = u.dpi
        INNER JOIN traffic_light tl ON e.traffic_light_id = tl.id
        WHERE u.dpi = ?
        ORDER BY e.date DESC`,
        [dpi]
    );
    return rows;
};
export const getEventsFull = async () => {
    const [rows] = await db().query(`
        SELECT e.*, v.type, v.color, u.name as owner_name, tl.location 
        FROM events e
        JOIN vehicles v ON e.plate = v.plate
        JOIN users u ON v.dpi_user = u.dpi
        JOIN traffic_light tl ON e.traffic_light_id = tl.id
    `);
    return rows;
};

export const deleteEvent = async (id) => {
    await db().query("DELETE FROM events WHERE id = ?", [id]);
};