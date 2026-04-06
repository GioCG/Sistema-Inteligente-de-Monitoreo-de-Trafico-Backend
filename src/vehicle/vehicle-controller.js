'use strict';
import * as VehicleModel from './vehicle-model.js';

export const createVehicle = async (req, res) => {
    try {
        await VehicleModel.createVehicle(req.body);

        res.status(201).json({
            success: true,
            msg: "Vehicle created"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const listVehicles = async (req, res) => {
    try {
        const vehicles = await VehicleModel.getVehicles();

        res.json({ success: true, vehicles });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteVehicle = async (req, res) => {
    try {
        await VehicleModel.deleteVehicle(req.params.plate);

        res.json({ success: true, msg: "Vehicle deleted" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};