'use strict';
import { db } from '../../configs/mysql.js';

export const createRequest = async ({ type, requested_by, payload }) => {
    const [result] = await db().query(
        `INSERT INTO requests (type, requested_by, payload) VALUES (?, ?, ?)`,
        [type, requested_by, JSON.stringify(payload)]
    );
    return result;
};

export const getRequests = async (status = null) => {
    if (status) {
        const [rows] = await db().query(
            `SELECT r.*, u.name AS requester_name
             FROM requests r
             JOIN users u ON r.requested_by = u.dpi
             WHERE r.status = ?
             ORDER BY r.created_at DESC`,
            [status]
        );
        return rows;
    }

    const [rows] = await db().query(
        `SELECT r.*, u.name AS requester_name
         FROM requests r
         JOIN users u ON r.requested_by = u.dpi
         ORDER BY r.created_at DESC`
    );
    return rows;
};

export const getRequestById = async (id) => {
    const [rows] = await db().query(
        `SELECT * FROM requests WHERE id = ?`,
        [id]
    );
    return rows[0] || null;
};

export const updateRequestStatus = async ({ id, status, reviewed_by, reason }) => {
    const [result] = await db().query(
        `UPDATE requests 
         SET status = ?, reviewed_by = ?, reason = ?
         WHERE id = ? AND status = 'PENDING'`,
        [status, reviewed_by, reason || null, id]
    );
    return result;
};