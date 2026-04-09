'use strict';
import { db } from '../../configs/mysql.js';

export const getEvidence = async () => {
    const [rows] = await db().query("CALL sp_getEvidence()");
    return rows[0];
};

export const createEvidence = async (data) => {
    const { image_path, event_id } = data;

    await db().query(
        "INSERT INTO evidence(image_path, event_id) VALUES(?, ?)",
        [image_path, event_id]
    );
};

export const getEvidenceByEvent = async (event_id) => {
    const [rows] = await db().query("SELECT * FROM evidence WHERE event_id = ?", [event_id]);
    return rows;
};

export const deleteEvidence = async (id) => {
    await db().query("DELETE FROM evidence WHERE id = ?", [id]);
};