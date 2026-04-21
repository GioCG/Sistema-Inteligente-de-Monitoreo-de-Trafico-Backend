'use strict';

import { db } from '../../configs/mysql.js';

export const esRoleValido = async (role = '') => {
    const [rows] = await db().query(
        "SELECT * FROM roles WHERE role = ? LIMIT 1",
        [role]
    );

    if (rows.length === 0) {
        throw new Error(`El rol ${role} no existe en la base de datos`);
    }
};

export const existenteEmail = async (email = '') => {
    const [rows] = await db().query(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [email]
    );

    if (rows.length > 0) {
        throw new Error(`El correo ${email} ya existe en la base de datos`);
    }
};

export const existeUsuarioByDPI = async (dpi = '') => {
    const [rows] = await db().query(
        "SELECT * FROM users WHERE dpi = ? LIMIT 1",
        [dpi]
    );

    if (rows.length === 0) {
        throw new Error(`El DPI ${dpi} no existe`);
    }
};

export const existeVehiculoByPlate = async (plate = '') => {
    const [rows] = await db().query(
        "SELECT * FROM vehicles WHERE plate = ? LIMIT 1",
        [plate]
    );

    if (rows.length === 0) {
        throw new Error(`La placa ${plate} no existe`);
    }
};

export const existePlaca = async (plate = '') => {
    const [rows] = await db().query(
        "SELECT * FROM vehicles WHERE plate = ? LIMIT 1",
        [plate]
    );

    if (rows.length > 0) {
        throw new Error(`La placa ${plate} ya existe`);
    }
};

export const existeTrafficLightById = async (id = '') => {
    const [rows] = await db().query(
        "SELECT * FROM traffic_light WHERE id = ? LIMIT 1",
        [id]
    );

    if (rows.length === 0) {
        throw new Error(`El semáforo con ID ${id} no existe`);
    }
};

export const existeEventoById = async (id = '') => {
    const [rows] = await db().query(
        "SELECT * FROM events WHERE id = ? LIMIT 1",
        [id]
    );

    if (rows.length === 0) {
        throw new Error(`El evento con ID ${id} no existe`);
    }
};

