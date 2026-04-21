'use strict';
import fs from 'fs';
import path from 'path';
import { db } from '../../configs/mysql.js';
import { createEvidence, getEvidence,getEvidenceByEvent } from './evidence-model.js';

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

        const [rows] = await db().query(
            `SELECT t.location, 
             CASE WHEN e.violation = 1 THEN 'infraccion' ELSE 'evento' END AS tipo 
             FROM events e 
             JOIN traffic_light t ON e.traffic_light_id = t.id 
             WHERE e.id = ?`,
            [event_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ estado: false, msg: "El evento no existe en el sistema" });
        }

        const { location, tipo } = rows[0];
        const cleanLocation = location.replace(/\s+/g, '_').toLowerCase();
        const savedFiles = [];

        for (const file of req.files) {
            const extension = path.extname(file.originalname);
            const finalFileName = `${cleanLocation}-${tipo}-ev${event_id}-${Date.now()}${extension}`;
            const finalPath = path.join('./configs/data/evidence', finalFileName);

            fs.renameSync(file.path, finalPath);

            await createEvidence({
                image_path: `/configs/data/evidence/${finalFileName}`,
                event_id
            });

            savedFiles.push(finalFileName);
        }

        return res.status(201).json({
            estado: true,
            msg: `${savedFiles.length} imagen(es) guardada(s)`,
            files: savedFiles
        });

    } catch (error) {
        for (const tmpPath of tempFiles) {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        }
        return res.status(500).json({ estado: false, error: error.message });
    }
};

export const listEvidence = async (req, res) => {
    try {
        const evidence = await getEvidence();
        return res.status(200).json({ estado: true, data: evidence });
    } catch (error) {
        return res.status(500).json({ estado: false, error: error.message });
    }
};
export const getEvidenceByEventController = async (req, res) => {
    try {
        const data = await getEvidenceByEvent(req.params.event_id);

        res.status(200).json({
            estado: true,
            evidence: data
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};
