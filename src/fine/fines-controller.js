'use strict';

import {
    createFineDB,
    getFines,
    getFineById,
    deleteFineDB
} from './fines-model.js';

// 🔥 CREAR MULTA MANUAL (opcional)
export const createFine = async (req, res) => {
    try {
        const { amount, description, event_id } = req.body;

        const result = await createFineDB({
            amount,
            description,
            event_id
        });

        return res.status(201).json({
            estado: true,
            message: "Multa creada",
            id: result.insertId
        });

    } catch (err) {
        return res.status(500).json({
            estado: false,
            message: err.message
        });
    }
};

// 📄 LISTAR MULTAS
export const getAllFines = async (req, res) => {
    try {
        const fines = await getFines();

        return res.json({
            estado: true,
            fines
        });

    } catch (err) {
        return res.status(500).json({
            estado: false,
            message: err.message
        });
    }
};

// 🔍 BUSCAR MULTA
export const getFine = async (req, res) => {
    try {
        const { id } = req.params;

        const fine = await getFineById(id);

        if (!fine) {
            return res.status(404).json({
                estado: false,
                message: "Multa no encontrada"
            });
        }

        return res.json({
            estado: true,
            fine
        });

    } catch (err) {
        return res.status(500).json({
            estado: false,
            message: err.message
        });
    }
};

// ❌ ELIMINAR MULTA
export const deleteFine = async (req, res) => {
    try {
        const { id } = req.params;

        await deleteFineDB(id);

        return res.json({
            estado: true,
            message: "Multa eliminada"
        });

    } catch (err) {
        return res.status(500).json({
            estado: false,
            message: err.message
        });
    }
};