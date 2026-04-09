import {
    createVehicle,
    getVehicles,
    deleteVehicle
} from './vehicle-model.js';

export const createVehicles = async (req, res) => {
    try {
        const result = await createVehicle(req.body);

        res.status(201).json({
            estado: true,
            msg: "Vehículo creado",
            result
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const listVehicles = async (req, res) => {
    try {
        const vehicles = await getVehicles();

        res.status(200).json({
            estado: true,
            vehicles
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const getVehicle = async (req, res) => {
    try {
        const vehicle = await getVehicleByPlate(req.params.plate);

        res.status(200).json({
            estado: true,
            vehicle
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const deleteVehicles = async (req, res) => {
    try {
        await deleteVehicle(req.params.plate);

        res.status(200).json({
            estado: true,
            msg: "Vehículo eliminado"
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};