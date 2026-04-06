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