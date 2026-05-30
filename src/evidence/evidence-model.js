'use strict';
import { db } from '../../configs/mysql.js';

export const getEvidence = async ({ role, dpi } = {}) => {
    const params = [];
    let where = "";
    if (Number(role) === 2) {
        where = "WHERE e.created_by_dpi = ?";
        params.push(dpi);
    }

    const [rows] = await db().query(`
        SELECT
            ev.id,
            ev.image_path,
            ev.event_id,
            e.date,
            e.speed,
            e.violation,
            e.traffic_light_status,
            e.plate,
            e.plate AS plate_visible,
            v.type,
            v.color,
            u.name AS owner_name,
            u.dpi AS owner_dpi
        FROM evidence ev
        LEFT JOIN events e ON ev.event_id = e.id
        LEFT JOIN vehicles v ON e.plate = v.plate
        LEFT JOIN users u ON v.dpi_user = u.dpi
        ${where}
        ORDER BY ev.id DESC
    `, params);
    return rows;
};

export const createEvidence = async (data) => {
    const { image_path, event_id } = data;

    await db().query(
        "INSERT INTO evidence(image_path, event_id) VALUES(?, ?)",
        [image_path, event_id]
    );
};

export const getEvidenceByEvent = async (event_id) => {
    const cleanEventId = String(event_id || '').replace(/^:/, '');
    const [rows] = await db().query(`
        SELECT
            ev.id,
            ev.image_path,
            ev.event_id,
            e.date,
            e.speed,
            e.violation,
            e.traffic_light_status,
            e.plate,
            e.plate AS plate_visible
        FROM evidence ev
        LEFT JOIN events e ON ev.event_id = e.id
        WHERE ev.event_id = ?
        ORDER BY ev.id DESC
    `, [cleanEventId]);
    return rows;
};

export const getEvidenceById = async (id) => {
    const cleanId = String(id || '').replace(/^:/, '');
    const [rows] = await db().query(`
        SELECT
            ev.id,
            ev.image_path,
            ev.event_id,
            e.date,
            e.plate,
            e.plate AS plate_visible
        FROM evidence ev
        LEFT JOIN events e ON ev.event_id = e.id
        WHERE ev.id = ?
        LIMIT 1
    `, [cleanId]);
    return rows[0] || null;
};

export const deleteEvidenceById = async (id) => {
    const cleanId = String(id || '').replace(/^:/, '');
    const [result] = await db().query('DELETE FROM evidence WHERE id = ?', [cleanId]);
    return result;
};
