'use strict';

import {
    getUserByDPI,
    processUserDeathDB,
    transferVehicleDB
} from '../user/user-model.js';

import{
    getVehicleByPlate
}from '../vehicle/vehicle-model.js'

export const desactivateByDeath = async (req, res) => {
    try {
        const { dpi } = req.params;

        const user = await getUserByDPI(dpi);
        
        if (!user) {
            return res.status(404).json({ 
                estado: false, 
                msg: "Usuario no encontrado" 
            });
        }


        if (user.estate == false || user.estate == 0) {
            return res.status(400).json({
                estado: false,
                msg: "Operación no válida: El usuario ya se encuentra desactivado en el sistema."
            });
        }

        await processUserDeathDB(dpi);

        res.status(200).json({
            estado: true,
            msg: "Protocolo de fallecimiento completado: Usuario desactivado y vehículos liberados."
        });

    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};


export const claimVehicle = async (req, res) => {
    try {
        const { plate, newOwnerDpi } = req.body;

        const vehicle = await getVehicleByPlate(plate);
        if (!vehicle) {
            return res.status(404).json({ estado: false, msg: "Vehículo no encontrado" });
        }

        const currentOwnerFromDB = vehicle.dpi_user;

        if (String(currentOwnerFromDB) === String(newOwnerDpi)) {
            return res.status(400).json({
                estado: false,
                msg: "Acceso denegado: El vehículo ya pertenece a este usuario."
            });
        }

        const newOwner = await getUserByDPI(newOwnerDpi);
        if (!newOwner || newOwner.estado == false) {
            return res.status(400).json({ 
                estado: false, 
                msg: "El nuevo dueño no es válido o está inactivo." 
            });
        }

        const success = await transferVehicleDB(plate, newOwnerDpi);

        if (success) {
            return res.status(200).json({
                estado: true,
                msg: "Transferencia exitosa",
                detalle: {
                    placa: plate,
                    anterior_dueno: currentOwnerFromDB || "SIN DUEÑO ANTERIOR",
                    nuevo_dueno: newOwnerDpi
                }
            });
        }

    } catch (error) {
        console.error("Error detectado:", error.message);
        return res.status(500).json({ 
            estado: false, 
            error: error.message 
        });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { dpi } = req.params;
        const { role_id } = req.body;

        await db().query(
            "UPDATE users SET role_id = ? WHERE dpi = ?",
            [role_id, dpi]
        );

        return res.json({
            estado: true,
            message: "Rol actualizado correctamente"
        });

    } catch (error) {
        return res.status(500).json({
            estado: false,
            message: "Error actualizando rol"
        });
    }
};