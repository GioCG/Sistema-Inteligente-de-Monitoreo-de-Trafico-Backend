'use strict';
import * as EvidenceModel from './evidence-model.js';

export const listEvidence = async (req, res) => {
    const data = await EvidenceModel.getEvidence();
    res.json({ success: true, data });
};

export const createEvidence = async (req, res) => {
    await EvidenceModel.createEvidence(req.body);

    res.json({
        success: true,
        msg: "Evidence created"
    });
};