import {
    generateTrafficLight,
    getTrafficLights
} from './trafficlight-model.js';

export const createTrafficLights = async (req, res) => {
    try {
        const result = await generateTrafficLight(req.body);

        res.status(201).json({
            estado: true,
            result
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const listTrafficLights = async (req, res) => {
    try {
        const data = await getTrafficLights();

        res.status(200).json({
            estado: true,
            trafficLights: data
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

