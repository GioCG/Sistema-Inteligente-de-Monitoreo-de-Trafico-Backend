'use strict';

import {
    createFineDB,
    getFines,
    getFinesByUser,
    getFineById,
    deleteFineDB,
    payFineDB,
    getFineHistory,
    createFineClaimDB,
    getFineClaimsDB,
    resolveFineClaimDB,
    eventCanBeUsedByOperator
} from './fines-model.js';

const OPERATOR_ALLOWED_FINE_TYPES = [
    "Parqueo en línea roja",
    "Estacionamiento en línea roja",
    "Estacionamiento en zona prohibida",
    "Parqueo en zona prohibida",
    "Parqueo en doble fila",
    "Obstrucción de entrada o salida",
    "Parqueo sobre paso peatonal",
    "Parqueo sobre acera"
];

const normalizeText = (value = "") => String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getAllowedOperatorFineType = (value = "") => {
    const normalized = normalizeText(value);
    return OPERATOR_ALLOWED_FINE_TYPES.find((item) => normalizeText(item) === normalized) || null;
};

export const createFine = async (req, res) => {
    try {
        const { amount, description, event_id } = req.body;
        let finalDescription = String(description || '').trim();

        if (Number(req.user?.role) === 2) {
            const event = await eventCanBeUsedByOperator({ eventId: Number(event_id), operatorDpi: req.user.udpi });
            const eventReason = getAllowedOperatorFineType(event.manual_reason);
            const descriptionReason = getAllowedOperatorFineType(finalDescription);

            if (!eventReason) {
                return res.status(403).json({
                    estado: false,
                    msg: "El operador solo puede crear multas para eventos manuales de estacionamiento/parqueo creados por él. No puede multar por semáforo o velocidad.",
                    allowed: OPERATOR_ALLOWED_FINE_TYPES
                });
            }

            if (finalDescription && !descriptionReason) {
                return res.status(400).json({
                    estado: false,
                    msg: "Tipo de multa no permitido para operador. Usa únicamente infracciones de estacionamiento/parqueo.",
                    allowed: OPERATOR_ALLOWED_FINE_TYPES
                });
            }

            finalDescription = descriptionReason || eventReason;
        }

        const result = await createFineDB({
            amount: Number(amount),
            description: finalDescription,
            event_id: Number(event_id)
        });

        console.log('================ MULTA CRUD ================');
        console.log(`[FINE] Evento ID: ${event_id}`);
        console.log(`[FINE] Monto: ${amount}`);
        console.log(`[FINE] Descripción: ${finalDescription}`);
        console.log(`[FINE] Creada por DPI: ${req.user?.udpi || 'N/A'} | Rol: ${req.user?.role || 'N/A'}`);
        console.log('============================================');

        return res.status(201).json({ estado: true, message: "Multa creada", id: result.insertId, fine_id: result.insertId, event_id: Number(event_id) });
    } catch (err) {
        console.error('[FINE] Error al crear multa:', err);
        return res.status(err.status || 500).json({ estado: false, message: err.message, msg: err.message });
    }
};

export const getAllFines = async (req, res) => {
    try {
        const fines = await getFines({ role: req.user?.role, dpi: req.user?.udpi });
        return res.json({ estado: true, fines });
    } catch (err) {
        return res.status(500).json({ estado: false, message: err.message });
    }
};

export const getFinesByUserController = async (req, res) => {
    try {
        const { dpi } = req.params;
        if (Number(req.user?.role) === 4 && Number(req.user?.udpi) !== Number(dpi)) {
            return res.status(403).json({ estado: false, msg: 'No puedes consultar multas de otro usuario' });
        }
        const fines = await getFinesByUser(dpi);
        return res.json({ estado: true, fines });
    } catch (err) {
        return res.status(500).json({ estado: false, message: err.message });
    }
};

export const getFine = async (req, res) => {
    try {
        const { id } = req.params;
        const fine = await getFineById(id);
        if (!fine) return res.status(404).json({ estado: false, message: "Multa no encontrada" });
        return res.json({ estado: true, fine });
    } catch (err) {
        return res.status(500).json({ estado: false, message: err.message });
    }
};

export const payFine = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_method, payer_name, card_number } = req.body;
        const role = Number(req.user?.role);
        const paidBy = role === 4 ? req.user?.udpi : null;
        const digits = String(card_number || '').replace(/\D/g, '');
        const cardLast4 = digits ? digits.slice(-4) : null;

        const result = await payFineDB({
            fineId: Number(id),
            paidBy,
            paymentMethod: payment_method || 'Pago ficticio',
            payerName: payer_name,
            cardLast4
        });

        console.log('================ PAGO FICTICIO ================');
        console.log(`[PAY] Multa pagada ID: ${id}`);
        console.log(`[PAY] Referencia: ${result.paymentReference}`);
        console.log(`[PAY] Evento: ${result.fine.event_id} | Placa: ${result.fine.plate}`);
        console.log('================================================');

        return res.status(200).json({
            estado: true,
            msg: 'Pago ficticio realizado. La multa fue movida al historial.',
            payment_reference: result.paymentReference,
            event_id: result.fine.event_id,
            plate: result.fine.plate
        });
    } catch (err) {
        return res.status(err.status || 500).json({ estado: false, message: err.message });
    }
};

export const getFineHistoryController = async (req, res) => {
    try {
        const role = Number(req.user?.role);
        const requestedDpi = req.params.dpi;
        const dpi = requestedDpi || (role === 4 || role === 2 ? req.user?.udpi : null);

        if (requestedDpi && role === 4 && Number(requestedDpi) !== Number(req.user.udpi)) {
            return res.status(403).json({ estado: false, msg: 'No puedes consultar historial de otro usuario' });
        }

        const history = await getFineHistory({ dpi, role });
        return res.json({ estado: true, history, fines: history });
    } catch (err) {
        return res.status(500).json({ estado: false, message: err.message });
    }
};

export const createFineClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (Number(req.user?.role) !== 4) {
            return res.status(403).json({ estado: false, msg: 'Solo ciudadanos pueden reclamar multas' });
        }
        if (!reason || String(reason).trim().length < 10) {
            return res.status(400).json({ estado: false, msg: 'Describe el motivo del reclamo con al menos 10 caracteres' });
        }

        const { result, fine } = await createFineClaimDB({
            fineId: Number(id),
            claimantDpi: req.user.udpi,
            reason
        });

        console.log('================ RECLAMO MULTA ================');
        console.log(`[CLAIM] Multa ID: ${id} | Reclamo ID: ${result.insertId}`);
        console.log(`[CLAIM] Ciudadano DPI: ${req.user.udpi} | Placa: ${fine.plate || fine.event_plate}`);
        console.log(`[CLAIM] Motivo: ${reason}`);
        console.log('================================================');

        return res.status(201).json({ estado: true, msg: 'Reclamo enviado para revisión del sistema', claim_id: result.insertId });
    } catch (err) {
        return res.status(err.status || 500).json({ estado: false, message: err.message, msg: err.message });
    }
};

export const listFineClaims = async (req, res) => {
    try {
        const claims = await getFineClaimsDB({ role: req.user?.role, dpi: req.user?.udpi });
        return res.json({ estado: true, claims, data: claims });
    } catch (err) {
        return res.status(500).json({ estado: false, message: err.message });
    }
};

export const resolveFineClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, resolution } = req.body;

        const result = await resolveFineClaimDB({
            claimId: Number(id),
            action,
            resolution,
            reviewedBy: req.user?.udpi
        });

        console.log('================ REVISION RECLAMO ================');
        console.log(`[CLAIM] Reclamo ID: ${id} | Acción: ${result.action}`);
        console.log(`[CLAIM] Revisado por SYSTEM DPI: ${req.user?.udpi || 'N/A'}`);
        console.log('===================================================');

        return res.json({ estado: true, msg: `Reclamo ${result.action === 'APPROVED' ? 'aprobado' : 'rechazado'} correctamente` });
    } catch (err) {
        return res.status(err.status || 500).json({ estado: false, message: err.message, msg: err.message });
    }
};

export const deleteFine = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteFineDB(id);
        return res.json({ estado: true, message: "Multa eliminada" });
    } catch (err) {
        return res.status(500).json({ estado: false, message: err.message });
    }
};
