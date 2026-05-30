'use strict';

import { db } from '../../configs/mysql.js';
import { getEventById } from '../event/event-model.js';

const fineSelect = `
    SELECT f.*, e.speed, e.violation, e.date AS event_date, e.traffic_light_status,
           e.plate AS event_plate, e.plate AS plate_visible, e.created_by_dpi, e.manual_reason,
           v.plate, v.type, v.color, u.name AS owner_name, u.dpi AS owner_dpi,
           ev.image_path AS evidence_path
    FROM fines f
    JOIN events e ON f.event_id = e.id
    LEFT JOIN vehicles v ON e.plate = v.plate
    LEFT JOIN users u ON v.dpi_user = u.dpi
    LEFT JOIN (
        SELECT event_id, MIN(image_path) AS image_path
        FROM evidence
        GROUP BY event_id
    ) ev ON ev.event_id = e.id
`;

export const ensureFineHistorySchema = async () => {
    await db().query(`
        CREATE TABLE IF NOT EXISTS fine_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fine_id INT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description TEXT NULL,
            event_id INT NULL,
            plate VARCHAR(20) NULL,
            owner_dpi BIGINT NULL,
            evidence_path VARCHAR(255) NULL,
            payment_reference VARCHAR(100) NULL,
            payment_method VARCHAR(60) NULL,
            payer_name VARCHAR(100) NULL,
            card_last4 VARCHAR(4) NULL,
            paid_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const [columns] = await db().query(`SHOW COLUMNS FROM fine_history`);
    const existing = new Set(columns.map((column) => column.Field));
    const alters = [];
    if (!existing.has('fine_id')) alters.push(`ADD COLUMN fine_id INT NULL AFTER id`);
    if (!existing.has('amount')) alters.push(`ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0`);
    if (!existing.has('description')) alters.push(`ADD COLUMN description TEXT NULL`);
    if (!existing.has('event_id')) alters.push(`ADD COLUMN event_id INT NULL`);
    if (!existing.has('plate')) alters.push(`ADD COLUMN plate VARCHAR(20) NULL`);
    if (!existing.has('owner_dpi')) alters.push(`ADD COLUMN owner_dpi BIGINT NULL`);
    if (!existing.has('evidence_path')) alters.push(`ADD COLUMN evidence_path VARCHAR(255) NULL`);
    if (!existing.has('payment_reference')) alters.push(`ADD COLUMN payment_reference VARCHAR(100) NULL`);
    if (!existing.has('payment_method')) alters.push(`ADD COLUMN payment_method VARCHAR(60) NULL`);
    if (!existing.has('payer_name')) alters.push(`ADD COLUMN payer_name VARCHAR(100) NULL`);
    if (!existing.has('card_last4')) alters.push(`ADD COLUMN card_last4 VARCHAR(4) NULL`);
    if (!existing.has('paid_at')) alters.push(`ADD COLUMN paid_at DATETIME NULL`);
    if (!existing.has('created_at')) alters.push(`ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    for (const alter of alters) await db().query(`ALTER TABLE fine_history ${alter}`);

    const [updatedColumns] = await db().query(`SHOW COLUMNS FROM fine_history`);
    const updated = new Set(updatedColumns.map((column) => column.Field));
    if (updated.has('user_dpi')) await db().query(`UPDATE fine_history SET owner_dpi = COALESCE(owner_dpi, user_dpi) WHERE owner_dpi IS NULL`);
    if (updated.has('paid_by_dpi')) await db().query(`UPDATE fine_history SET owner_dpi = COALESCE(owner_dpi, paid_by_dpi) WHERE owner_dpi IS NULL`);
};

export const ensureFinesSchema = async () => {
    const [columns] = await db().query(`SHOW COLUMNS FROM fines`);
    const descriptionColumn = columns.find((column) => column.Field === 'description');
    if (!descriptionColumn) {
        await db().query(`ALTER TABLE fines ADD COLUMN description TEXT NULL`);
        return;
    }
    const type = String(descriptionColumn.Type || '').toLowerCase();
    if (!type.includes('text')) {
        console.log('[FINES] Ajustando fines.description a TEXT para evitar ER_DATA_TOO_LONG');
        await db().query(`ALTER TABLE fines MODIFY description TEXT NULL`);
    }
};

export const ensureFineClaimsSchema = async () => {
    await db().query(`
        CREATE TABLE IF NOT EXISTS fine_claims (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fine_id INT NULL,
            event_id INT NULL,
            plate VARCHAR(20) NULL,
            claimant_dpi BIGINT NOT NULL,
            reason TEXT NOT NULL,
            status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
            resolution TEXT NULL,
            reviewed_by BIGINT NULL,
            resolved_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    const [columns] = await db().query(`SHOW COLUMNS FROM fine_claims`);
    const existing = new Set(columns.map((column) => column.Field));
    const alters = [];
    if (!existing.has('fine_id')) alters.push(`ADD COLUMN fine_id INT NULL AFTER id`);
    if (!existing.has('event_id')) alters.push(`ADD COLUMN event_id INT NULL`);
    if (!existing.has('plate')) alters.push(`ADD COLUMN plate VARCHAR(20) NULL`);
    if (!existing.has('claimant_dpi')) alters.push(`ADD COLUMN claimant_dpi BIGINT NOT NULL`);
    if (!existing.has('reason')) alters.push(`ADD COLUMN reason TEXT NOT NULL`);
    if (!existing.has('status')) alters.push(`ADD COLUMN status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING'`);
    if (!existing.has('resolution')) alters.push(`ADD COLUMN resolution TEXT NULL`);
    if (!existing.has('reviewed_by')) alters.push(`ADD COLUMN reviewed_by BIGINT NULL`);
    if (!existing.has('resolved_at')) alters.push(`ADD COLUMN resolved_at DATETIME NULL`);
    if (!existing.has('created_at')) alters.push(`ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
    if (!existing.has('updated_at')) alters.push(`ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    for (const alter of alters) await db().query(`ALTER TABLE fine_claims ${alter}`);
};

export const createFineDB = async (fine) => {
    await ensureFinesSchema();

    const { amount, description, event_id } = fine;
    const safeDescription = String(description || '').trim().slice(0, 500);

    const [result] = await db().query(
        `INSERT INTO fines (amount, description, event_id) VALUES (?, ?, ?)`,
        [amount, safeDescription, event_id]
    );
    return result;
};

export const getLatestEventByPlate = async (plate) => {
    const [rows] = await db().query(
        `SELECT id, plate, speed, date FROM events WHERE plate = ? ORDER BY date DESC, id DESC LIMIT 1`,
        [plate]
    );
    return rows.length > 0 ? rows[0] : null;
};

export const getFines = async ({ role, dpi } = {}) => {
    const params = [];
    let where = '';
    if (Number(role) === 2) {
        where = 'WHERE e.created_by_dpi = ?';
        params.push(dpi);
    }
    const [rows] = await db().query(`${fineSelect} ${where} ORDER BY f.id DESC`, params);
    return rows;
};

export const getFineById = async (id) => {
    const [rows] = await db().query(`${fineSelect} WHERE f.id = ? LIMIT 1`, [id]);
    return rows.length > 0 ? rows[0] : null;
};

export const getFinesByUser = async (dpi) => {
    const [rows] = await db().query(
        `${fineSelect} WHERE v.dpi_user = ? ORDER BY e.date DESC`,
        [dpi]
    );
    return rows;
};

export const deleteFineDB = async (id) => {
    await db().query(`DELETE FROM fines WHERE id = ?`, [id]);
};

export const payFineDB = async ({ fineId, paidBy, paymentMethod, payerName, cardLast4 }) => {
    await ensureFineHistorySchema();

    const connection = await db().getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(`${fineSelect} WHERE f.id = ? LIMIT 1`, [fineId]);
        const fine = rows[0];
        if (!fine) {
            const err = new Error('Multa no encontrada');
            err.status = 404;
            throw err;
        }
        if (Number(paidBy) && fine.owner_dpi && Number(fine.owner_dpi) !== Number(paidBy)) {
            const err = new Error('No puedes pagar una multa de otro usuario');
            err.status = 403;
            throw err;
        }
        const paymentReference = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        await connection.query(
            `INSERT INTO fine_history
             (fine_id, amount, description, event_id, plate, owner_dpi, evidence_path, payment_reference, payment_method, payer_name, card_last4, paid_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [fine.id, fine.amount, fine.description, fine.event_id, fine.plate || fine.event_plate || fine.plate_visible, fine.owner_dpi, fine.evidence_path, paymentReference, paymentMethod || 'FICTICIO', payerName || null, cardLast4 || null]
        );
        await connection.query(`DELETE FROM fines WHERE id = ?`, [fineId]);
        await connection.commit();
        return { paymentReference, fine };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getFineHistory = async ({ dpi, role } = {}) => {
    await ensureFineHistorySchema();
    const params = [];
    let where = '';
    if (dpi && Number(role) === 4) {
        where = 'WHERE fh.owner_dpi = ?';
        params.push(dpi);
    } else if (dpi && Number(role) === 2) {
        where = 'WHERE e.created_by_dpi = ?';
        params.push(dpi);
    } else if (dpi && !role) {
        where = 'WHERE fh.owner_dpi = ?';
        params.push(dpi);
    }

    const [rows] = await db().query(
        `SELECT fh.*, e.speed, e.date AS event_date, e.traffic_light_status, e.created_by_dpi, v.type, v.color, u.name AS owner_name
         FROM fine_history fh
         LEFT JOIN events e ON fh.event_id = e.id
         LEFT JOIN vehicles v ON fh.plate = v.plate
         LEFT JOIN users u ON fh.owner_dpi = u.dpi
         ${where}
         ORDER BY fh.paid_at DESC, fh.id DESC`,
        params
    );
    return rows;
};

export const createFineClaimDB = async ({ fineId, claimantDpi, reason }) => {
    await ensureFineClaimsSchema();
    const fine = await getFineById(fineId);
    if (!fine) {
        const err = new Error('Multa no encontrada');
        err.status = 404;
        throw err;
    }
    if (Number(fine.owner_dpi) !== Number(claimantDpi)) {
        const err = new Error('Solo el propietario del vehículo puede reclamar esta multa');
        err.status = 403;
        throw err;
    }

    const [pending] = await db().query(
        `SELECT id FROM fine_claims WHERE fine_id = ? AND status = 'PENDING' LIMIT 1`,
        [fineId]
    );
    if (pending.length) {
        const err = new Error('Ya existe un reclamo pendiente para esta multa');
        err.status = 400;
        throw err;
    }

    const [result] = await db().query(
        `INSERT INTO fine_claims (fine_id, event_id, plate, claimant_dpi, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [fine.id, fine.event_id, fine.plate || fine.event_plate || fine.plate_visible, claimantDpi, String(reason || '').trim().slice(0, 1000)]
    );
    return { result, fine };
};

export const getFineClaimsDB = async ({ role, dpi } = {}) => {
    await ensureFineClaimsSchema();
    const params = [];
    let where = '';
    if (Number(role) === 4) {
        where = 'WHERE fc.claimant_dpi = ?';
        params.push(dpi);
    }

    const [rows] = await db().query(
        `SELECT fc.*, f.amount, f.description AS fine_description, e.speed, e.traffic_light_status, e.date AS event_date,
                ev.image_path AS evidence_path, u.name AS claimant_name
         FROM fine_claims fc
         LEFT JOIN fines f ON fc.fine_id = f.id
         LEFT JOIN events e ON fc.event_id = e.id
         LEFT JOIN users u ON fc.claimant_dpi = u.dpi
         LEFT JOIN (
            SELECT event_id, MIN(image_path) AS image_path
            FROM evidence
            GROUP BY event_id
         ) ev ON ev.event_id = fc.event_id
         ${where}
         ORDER BY fc.created_at DESC, fc.id DESC`,
        params
    );
    return rows;
};

export const resolveFineClaimDB = async ({ claimId, action, resolution, reviewedBy }) => {
    await ensureFineClaimsSchema();
    const normalizedAction = String(action || '').toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normalizedAction)) {
        const err = new Error('Acción inválida. Usa APPROVED o REJECTED');
        err.status = 400;
        throw err;
    }

    const connection = await db().getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(`SELECT * FROM fine_claims WHERE id = ? LIMIT 1`, [claimId]);
        const claim = rows[0];
        if (!claim) {
            const err = new Error('Reclamo no encontrado');
            err.status = 404;
            throw err;
        }
        if (claim.status !== 'PENDING') {
            const err = new Error(`El reclamo ya fue ${claim.status}`);
            err.status = 400;
            throw err;
        }

        await connection.query(
            `UPDATE fine_claims
             SET status = ?, resolution = ?, reviewed_by = ?, resolved_at = NOW()
             WHERE id = ?`,
            [normalizedAction, resolution || null, reviewedBy || null, claimId]
        );

        if (normalizedAction === 'APPROVED' && claim.fine_id) {
            await connection.query(`DELETE FROM fines WHERE id = ?`, [claim.fine_id]);
        }

        await connection.commit();
        return { claim, action: normalizedAction };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const eventCanBeUsedByOperator = async ({ eventId, operatorDpi }) => {
    const event = await getEventById(eventId);
    if (!event) {
        const err = new Error('Evento no encontrado');
        err.status = 404;
        throw err;
    }
    if (Number(event.created_by_dpi) !== Number(operatorDpi)) {
        const err = new Error('El operador solo puede crear multas sobre eventos creados por él');
        err.status = 403;
        throw err;
    }
    return event;
};
