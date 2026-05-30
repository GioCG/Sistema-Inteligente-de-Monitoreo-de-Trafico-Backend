'use strict';
import { db } from '../../configs/mysql.js';

export const ensureEventsSchema = async () => {
    const [columns] = await db().query(`SHOW COLUMNS FROM events`);
    const existing = new Set(columns.map((column) => column.Field));
    const alters = [];

    if (!existing.has('created_by_dpi')) {
        alters.push(`ADD COLUMN created_by_dpi BIGINT NULL AFTER plate`);
    }
    if (!existing.has('created_by_role_id')) {
        alters.push(`ADD COLUMN created_by_role_id INT NULL AFTER created_by_dpi`);
    }
    if (!existing.has('manual_reason')) {
        alters.push(`ADD COLUMN manual_reason TEXT NULL AFTER created_by_role_id`);
    }

    for (const alter of alters) {
        await db().query(`ALTER TABLE events ${alter}`);
    }
};

export const createEvent = async (data) => {
    await ensureEventsSchema();

    const {
        speed,
        traffic_light_status,
        violation,
        traffic_light_id,
        plate,
        created_by_dpi,
        created_by_role_id,
        manual_reason
    } = data;

    const [result] = await db().query(
        `INSERT INTO events 
        (speed, date, traffic_light_status, violation, traffic_light_id, plate, created_by_dpi, created_by_role_id, manual_reason)
        VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
        [
            Number(speed || 0),
            traffic_light_status,
            violation,
            traffic_light_id,
            plate,
            created_by_dpi || null,
            created_by_role_id || null,
            manual_reason || null
        ]
    );
    return result;
};

export const getEvents = async ({ role, dpi } = {}) => {
    await ensureEventsSchema();

    const params = [];
    let where = '';

    if (Number(role) === 2) {
        where = 'WHERE e.created_by_dpi = ?';
        params.push(dpi);
    }

    const [rows] = await db().query(`
        SELECT
            e.id,
            e.speed,
            e.date,
            e.traffic_light_status,
            e.violation,
            e.plate,
            e.created_by_dpi,
            e.created_by_role_id,
            e.manual_reason,
            tl.location AS traffic_light_location,
            tl.status AS traffic_light_current_status,
            v.type,
            v.color,
            u.name AS owner_name,
            creator.name AS created_by_name
        FROM events e
        LEFT JOIN vehicles v ON e.plate = v.plate
        LEFT JOIN users u ON v.dpi_user = u.dpi
        LEFT JOIN users creator ON e.created_by_dpi = creator.dpi
        LEFT JOIN traffic_light tl ON e.traffic_light_id = tl.id
        ${where}
        ORDER BY e.date DESC, e.id DESC
    `, params);
    return rows;
};

export const getEventById = async (id) => {
    await ensureEventsSchema();
    const [rows] = await db().query(
        `SELECT e.*, v.dpi_user AS owner_dpi
         FROM events e
         LEFT JOIN vehicles v ON e.plate = v.plate
         WHERE e.id = ?
         LIMIT 1`,
        [id]
    );
    return rows[0] || null;
};

export const eventBelongsToOperator = async ({ eventId, dpi }) => {
    await ensureEventsSchema();
    const [rows] = await db().query(
        `SELECT id FROM events WHERE id = ? AND created_by_dpi = ? LIMIT 1`,
        [eventId, dpi]
    );
    return rows.length > 0;
};

export const getEventsByUserDB = async (dpi) => {
    await ensureEventsSchema();
    const [rows] = await db().query(
        `SELECT 
            e.id,
            e.speed,
            e.date,
            e.traffic_light_status,
            e.violation,
            e.plate,
            e.manual_reason,
            tl.location AS traffic_light_location,
            tl.status AS traffic_light_current_status
        FROM events e
        INNER JOIN vehicles v ON e.plate = v.plate
        INNER JOIN users u ON v.dpi_user = u.dpi
        LEFT JOIN traffic_light tl ON e.traffic_light_id = tl.id
        WHERE u.dpi = ?
        ORDER BY e.date DESC`,
        [dpi]
    );
    return rows;
};

export const getEventsFull = async () => {
    await ensureEventsSchema();
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
