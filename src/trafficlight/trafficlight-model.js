'use strict';
import { db } from '../../configs/mysql.js';

export const getTrafficLights = async () => {
    const [rows] = await db().query("CALL sp_getTrafficLights()");
    return rows[0];
};

export const generateTrafficLight = async (data) => {
    const { location, status } = data;

    await db().query(
        "INSERT INTO traffic_light(location, status) VALUES(?, ?)",
        [location, status]
    );
};

export const updateTrafficLight = async (id, data) => {
    const { location, status } = data;
    await db().query(
        "UPDATE traffic_light SET location = ?, status = ? WHERE id = ?",
        [location, status, id]
    );
};

export const deleteTrafficLight = async (id) => {
    await db().query("DELETE FROM traffic_light WHERE id = ?", [id]);
};