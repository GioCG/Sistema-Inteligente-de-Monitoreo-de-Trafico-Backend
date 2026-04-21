'use strict';

import bcrypt from "bcrypt";
import { createUser, getUserByDPI } from "../src/user/user-model.js";

export const createAdmin = async () => {
    try {
        const dpi = 2999713920101;

        const existingUser = await getUserByDPI(dpi);

        if (existingUser) {
            console.log("El administrador ya existe.");
            return;
        }

        const adminData = {
            dpi: dpi,
            name: "Admin",
            username: "admin",
            email: "admin@example.com",
            password: "admin12345",
            address: "System",
            role_id: 1 
        };

        const salt = await bcrypt.genSalt(10);
        adminData.password = await bcrypt.hash(adminData.password, salt);

        await createUser(adminData);

        console.log("Administrador por defecto creado exitosamente.");

    } catch (err) {
        console.error("Error al crear el administrador:", err.message);
    }
};