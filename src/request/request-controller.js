'use strict';
import {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus
} from './request-model.js';
import { createVehicle, getVehicleByPlate } from '../vehicle/vehicle-model.js';
import { getUserByDPI } from '../user/user-model.js';
import { db } from '../../configs/mysql.js';

// ─── CIUDADANO: solicitar registro de vehículo ───────────────────────────────
export const requestRegisterVehicle = async (req, res) => {
    try {
        const { plate, type, color } = req.body;
        const requested_by = req.user.udpi;

        // Verificar que la placa no exista ya
        const [existing] = await db().query(
            `SELECT plate FROM vehicles WHERE plate = ?`, [plate]
        );
        if (existing.length > 0) {
            return res.status(400).json({ estado: false, msg: "La placa ya está registrada" });
        }

        // Verificar que no tenga ya una solicitud pendiente para esa placa
        const [pending] = await db().query(
            `SELECT id FROM requests 
             WHERE type = 'REGISTER_VEHICLE' 
             AND status = 'PENDING' 
             AND JSON_EXTRACT(payload, '$.plate') = ?`,
            [plate]
        );
        if (pending.length > 0) {
            return res.status(400).json({ estado: false, msg: "Ya existe una solicitud pendiente para esa placa" });
        }

        await createRequest({
            type: 'REGISTER_VEHICLE',
            requested_by,
            payload: { plate, type, color, dpi_user: requested_by }
        });

        return res.status(201).json({
            estado: true,
            msg: "Solicitud de registro enviada, esperando aprobación"
        });

    } catch (error) {
        return res.status(500).json({ estado: false, error: error.message });
    }
};

// ─── CIUDADANO: solicitar reclamar un vehículo ───────────────────────────────
export const requestClaimVehicle = async (req, res) => {
    try {
        const { plate } = req.body;
        const requested_by = req.user.udpi;

        // Verificar que el vehículo exista
        const [vehicle] = await db().query(
            `SELECT * FROM vehicles WHERE plate = ?`, [plate]
        );
        if (vehicle.length === 0) {
            return res.status(404).json({ estado: false, msg: "Vehículo no encontrado" });
        }

        // Verificar que no sea ya su vehículo
        if (vehicle[0].dpi_user == requested_by) {
            return res.status(400).json({ estado: false, msg: "Este vehículo ya te pertenece" });
        }

        // Verificar que no tenga solicitud pendiente para ese vehículo
        const [pending] = await db().query(
            `SELECT id FROM requests 
             WHERE type = 'CLAIM_VEHICLE' 
             AND status = 'PENDING' 
             AND JSON_EXTRACT(payload, '$.plate') = ?`,
            [plate]
        );
        if (pending.length > 0) {
            return res.status(400).json({ estado: false, msg: "Ya existe una solicitud pendiente para ese vehículo" });
        }

        await createRequest({
            type: 'CLAIM_VEHICLE',
            requested_by,
            payload: { plate, newOwnerDpi: requested_by }
        });

        return res.status(201).json({
            estado: true,
            msg: "Solicitud de reclamo enviada, esperando aprobación"
        });

    } catch (error) {
        return res.status(500).json({ estado: false, error: error.message });
    }
};

// ─── OPERADOR/ADMIN: listar solicitudes ──────────────────────────────────────
export const listRequests = async (req, res) => {
    try {
        const { status } = req.query; // ?status=PENDING
        const requests = await getRequests(status || null);

        return res.status(200).json({ estado: true, data: requests });
    } catch (error) {
        return res.status(500).json({ estado: false, error: error.message });
    }
};

// ─── OPERADOR/ADMIN: aprobar o rechazar ──────────────────────────────────────
export const resolveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // action: APPROVED | REJECTED
        const reviewed_by = req.user.udpi;

        const request = await getRequestById(id);

        if (!request) {
            return res.status(404).json({ estado: false, msg: "Solicitud no encontrada" });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ estado: false, msg: `La solicitud ya fue ${request.status}` });
        }

        if (action === 'APPROVED') {
            const payload = typeof request.payload === 'string'
                ? JSON.parse(request.payload)
                : request.payload;

            // Ejecutar la acción según el tipo
            if (request.type === 'REGISTER_VEHICLE') {
                await db().query(
                    `INSERT INTO vehicles (plate, type, color, dpi_user) VALUES (?, ?, ?, ?)`,
                    [payload.plate, payload.type, payload.color, payload.dpi_user]
                );
            }

            if (request.type === 'CLAIM_VEHICLE') {
                await db().query(
                    `UPDATE vehicles SET dpi_user = ? WHERE plate = ?`,
                    [payload.newOwnerDpi, payload.plate]
                );
            }
        }

        await updateRequestStatus({
            id,
            status: action,
            reviewed_by,
            reason: action === 'REJECTED' ? reason : null
        });

        return res.status(200).json({
            estado: true,
            msg: `Solicitud ${action === 'APPROVED' ? 'aprobada' : 'rechazada'} correctamente`
        });

    } catch (error) {
        return res.status(500).json({ estado: false, error: error.message });
    }
};

// ─── CIUDADANO: ver sus propias solicitudes ───────────────────────────────────
export const myRequests = async (req, res) => {
    try {
        const dpi = req.user.udpi;

        const [rows] = await db().query(
            `SELECT id, type, status, payload, reason, created_at, updated_at
             FROM requests
             WHERE requested_by = ?
             ORDER BY created_at DESC`,
            [dpi]
        );

        return res.status(200).json({ estado: true, data: rows });
    } catch (error) {
        return res.status(500).json({ estado: false, error: error.message });
    }
};