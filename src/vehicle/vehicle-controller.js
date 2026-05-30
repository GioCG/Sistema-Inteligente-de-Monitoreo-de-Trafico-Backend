import {
    createVehicle,
    getVehicleByPlate,
    getVehiclesByUser,
    getAllVehicles,
    deleteVehicle
} from './vehicle-model.js';

const normalizePlate = (plate = '') => String(plate).toUpperCase().replace(/[^A-Z0-9]/g, '');

export const createVehicles = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            plate: normalizePlate(req.body.plate),
            dpi_user: req.body.dpi_user ? Number(req.body.dpi_user) : null
        };

        const result = await createVehicle(payload);

        res.status(201).json({
            estado: true,
            msg: "Vehículo creado",
            result
        });
    } catch (error) {
        res.status(500).json({ estado: false, message: error.message, error: error.message });
    }
};

export const listVehicles = async (req, res) => {
    try {
        const vehicles = await getAllVehicles();

        res.status(200).json({
            estado: true,
            vehicles
        });
    } catch (error) {
        res.status(500).json({ estado: false, message: error.message, error: error.message });
    }
};

export const getVehiclesByUsers = async (req, res) => {
    try {
        const { dpi } = req.params;
        const vehicles = await getVehiclesByUser(dpi);

        res.status(200).json({
            estado: true,
            vehicles
        });
    } catch (error) {
        res.status(500).json({ estado: false, message: error.message, error: error.message });
    }
};

export const getVehicle = async (req, res) => {
    try {
        const plate = normalizePlate(req.params.plate);
        const vehicle = await getVehicleByPlate(plate);

        if (!vehicle) {
            return res.status(404).json({
                estado: false,
                message: "No se encontró vehículo registrado con esa placa",
                plate
            });
        }

        console.log('================ BUSQUEDA PLACA ================');
        console.log(`[VEHICLE] Placa: ${vehicle.plate}`);
        console.log(`[VEHICLE] Propietario: ${vehicle.owner_name || 'N/A'} | DPI: ${vehicle.dpi_user || 'N/A'}`);
        console.log('=================================================');

        res.status(200).json({
            estado: true,
            vehicle,
            user: {
                dpi: vehicle.dpi_user,
                name: vehicle.owner_name,
                username: vehicle.owner_username,
                email: vehicle.owner_email,
                address: vehicle.owner_address,
                role_id: vehicle.owner_role_id
            }
        });
    } catch (error) {
        res.status(500).json({ estado: false, message: error.message, error: error.message });
    }
};

export const deleteVehicles = async (req, res) => {
    try {
        await deleteVehicle(normalizePlate(req.params.plate));

        res.status(200).json({
            estado: true,
            msg: "Vehículo eliminado"
        });
    } catch (error) {
        res.status(500).json({ estado: false, message: error.message, error: error.message });
    }
};
