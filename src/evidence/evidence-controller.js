'use strict';
import fs from 'fs';
import path from 'path';
import { db } from '../../configs/mysql.js';
import { createEvidence, getEvidence, getEvidenceByEvent, getEvidenceById, deleteEvidenceById } from './evidence-model.js';
import { getEventById } from '../event/event-model.js';

const evidenceDir = path.resolve(process.cwd(), 'configs', 'data', 'evidence');

const normalizeEventId = (value) => String(value || '').replace(/^:/, '');

export const createEvidences = async (req, res) => {
    const tempFiles = req.files ? req.files.map(f => f.path) : [];

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ estado: false, msg: "Falta al menos una imagen de evidencia" });
        }

        const event_id = parseInt(req.body.event_id);

        if (!event_id || isNaN(event_id)) {
            return res.status(400).json({ estado: false, msg: "event_id inválido" });
        }

        if (!fs.existsSync(evidenceDir)) {
            fs.mkdirSync(evidenceDir, { recursive: true });
        }

        const [rows] = await db().query(
            `SELECT COALESCE(t.location, 'ubicacion') AS location,
             CASE WHEN e.violation = 1 THEN 'infraccion' ELSE 'evento' END AS tipo
             FROM events e
             LEFT JOIN traffic_light t ON e.traffic_light_id = t.id
             WHERE e.id = ?`,
            [event_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ estado: false, msg: "El evento no existe en el sistema" });
        }

        if (Number(req.user?.role) === 2) {
            const event = await getEventById(event_id);
            if (!event || Number(event.created_by_dpi) !== Number(req.user.udpi)) {
                return res.status(403).json({ estado: false, msg: "El operador solo puede agregar evidencia a eventos creados por él" });
            }
        }

        const { location, tipo } = rows[0];
        const cleanLocation = String(location || 'ubicacion').replace(/\s+/g, '_').toLowerCase();
        const savedFiles = [];

        for (const file of req.files) {
            const extension = path.extname(file.originalname || '.jpg') || '.jpg';
            const finalFileName = `${cleanLocation}-${tipo}-ev${event_id}-${Date.now()}-${Math.floor(Math.random() * 1000)}${extension}`;
            const finalPath = path.join(evidenceDir, finalFileName);

            fs.renameSync(file.path, finalPath);

            const publicPath = `/configs/data/evidence/${finalFileName}`;

            await createEvidence({
                image_path: publicPath,
                event_id
            });

            savedFiles.push({ file: finalFileName, image_path: publicPath, url: publicPath });
        }

        console.log('================ EVIDENCIA CRUD ================');
        console.log(`[EVIDENCE] Evento ID: ${event_id}`);
        console.log(`[EVIDENCE] Archivos guardados: ${savedFiles.map(f => f.file).join(', ')}`);
        console.log('================================================');

        return res.status(201).json({
            estado: true,
            msg: `${savedFiles.length} imagen(es) guardada(s)`,
            files: savedFiles,
            evidence: savedFiles
        });

    } catch (error) {
        for (const tmpPath of tempFiles) {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        }
        console.error('[EVIDENCE] Error:', error);
        return res.status(500).json({ estado: false, error: error.message, message: error.message });
    }
};

export const listEvidence = async (req, res) => {
    try {
        const evidence = await getEvidence({ role: req.user?.role, dpi: req.user?.udpi });
        return res.status(200).json({ estado: true, data: evidence, evidence, evidences: evidence });
    } catch (error) {
        console.error('[EVIDENCE] Error listando:', error);
        return res.status(500).json({ estado: false, error: error.message, message: error.message });
    }
};

export const getEvidenceByEventController = async (req, res) => {
    try {
        const eventId = normalizeEventId(req.params.event_id);
        const data = await getEvidenceByEvent(eventId);

        res.status(200).json({
            estado: true,
            evidence: data,
            data
        });
    } catch (error) {
        console.error('[EVIDENCE] Error por evento:', error);
        res.status(500).json({ estado: false, error: error.message, message: error.message });
    }
};

export const deleteEvidenceController = async (req, res) => {
    try {
        const id = normalizeEventId(req.params.id);
        const evidence = await getEvidenceById(id);

        if (!evidence) {
            return res.status(404).json({ estado: false, message: 'Evidencia no encontrada' });
        }

        await deleteEvidenceById(id);

        const imagePath = evidence.image_path ? path.resolve(process.cwd(), String(evidence.image_path).replace(/^\//, '')) : null;
        if (imagePath && imagePath.startsWith(evidenceDir) && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        return res.json({ estado: true, message: 'Evidencia eliminada' });
    } catch (error) {
        console.error('[EVIDENCE] Error eliminando:', error);
        return res.status(500).json({ estado: false, error: error.message, message: error.message });
    }
};
