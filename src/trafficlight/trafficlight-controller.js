'use strict';
import {getTrafficLights, generateTrafficLight} from '../trafficlight/trafficlight-model.js';

export const listTrafficLights = async (req, res) => {
    const data = await getTrafficLights();
    res.json({ success: true, data });
};

export const createTrafficLight = async (req, res) => {
    await generateTrafficLight(req.body);
    res.json({ success: true, msg: "Traffic light created" });
};