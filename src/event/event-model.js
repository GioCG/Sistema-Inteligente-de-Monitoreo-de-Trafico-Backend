'use strict';
import { db } from '../../configs/mysql.js';

export const createEvent = async (data) => {
    const {
        speed,
        date,
        traffic_light_status,
        violation,
        traffic_light_id,
        plate
    } = data;

    await db().query(
        "CALL sp_createEvent(?, ?, ?, ?, ?, ?)",
        [speed, date, traffic_light_status, violation, traffic_light_id, plate]
    );
};

export const getEvents = async () => {
    const [rows] = await db().query("CALL sp_getEvents()");
    return rows[0];
};