import {
    createEvidence,
    getEvidence
} from './evidence-model.js';

export const createEvidences = async (req, res) => {
    try {
        const result = await createEvidence(req.body);

        res.status(201).json({
            estado: true,
            result
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const listEvidence = async (req, res) => {
    try {
        const data = await getEvidence();

        res.status(200).json({
            estado: true,
            evidence: data
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
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

export const deleteEvidenceController = async (req, res) => {
    try {
        await deleteEvidence(req.params.id);

        res.status(200).json({
            estado: true,
            msg: "Evidencia eliminada"
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};