'use strict';

import {
    getUsers,
    getUserByDPI,
    updateUserDB,
    updateUserProfileDB,
    updatePasswordDB,
    getRoles,
    getRoleById,
    updateUserRoleDB,
    emailBelongsToAnotherUser,
    usernameBelongsToAnotherUser
} from './user-model.js';

import bcrypt from 'bcrypt';

const sanitizeUser = (user) => {
    if (!user) return null;
    const { password, reset_token, reset_token_expires, ...safe } = user;
    return safe;
};

export const listUser = async (req, res) => {
    try {
        const users = await getUsers();
        res.status(200).json({ estado: true, users });
    } catch (error) {
        res.status(500).json({ estado: false, msg: "Error al obtener usuarios", error: error.message });
    }
};

export const listRoles = async (req, res) => {
    try {
        const roles = await getRoles();
        return res.status(200).json({ estado: true, roles });
    } catch (error) {
        return res.status(500).json({ estado: false, msg: 'Error al obtener roles', error: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        const { dpi } = req.params;
        const user = await getUserByDPI(dpi);
        if (!user) return res.status(404).json({ estado: false, msg: "Usuario no encontrado" });
        res.status(200).json({ estado: true, user: sanitizeUser(user) });
    } catch (error) {
        res.status(500).json({ estado: false, msg: "Error al obtener usuario", error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { dpi } = req.params;
        await updateUserDB(dpi, req.body);
        res.status(200).json({ estado: true, msg: "Usuario actualizado" });
    } catch (error) {
        res.status(500).json({ estado: false, msg: "Error al actualizar usuario", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { dpi } = req.params;
        const { name, username, email, address } = req.body;

        const user = await getUserByDPI(dpi);
        if (!user) return res.status(404).json({ estado: false, msg: 'Usuario no encontrado' });

        if (email && await emailBelongsToAnotherUser(email, dpi)) {
            return res.status(400).json({ estado: false, msg: 'Ese correo ya pertenece a otro usuario' });
        }

        if (username && await usernameBelongsToAnotherUser(username, dpi)) {
            return res.status(400).json({ estado: false, msg: 'Ese nombre de usuario ya pertenece a otro usuario' });
        }

        await updateUserProfileDB(dpi, {
            name: name?.trim(),
            username: username?.trim(),
            email: email ? email.toLowerCase().trim() : undefined,
            address: address?.trim(),
        });

        const updated = await getUserByDPI(dpi);
        return res.status(200).json({ estado: true, msg: 'Perfil actualizado', user: sanitizeUser(updated) });
    } catch (error) {
        return res.status(500).json({ estado: false, msg: 'Error al actualizar perfil', error: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { dpi } = req.params;
        const roleId = Number(req.body.role_id);

        if (!Number.isInteger(roleId) || roleId < 1) {
            return res.status(400).json({ estado: false, msg: 'role_id inválido' });
        }

        const user = await getUserByDPI(dpi);
        if (!user) return res.status(404).json({ estado: false, msg: 'Usuario no encontrado' });

        const role = await getRoleById(roleId);
        if (!role) return res.status(404).json({ estado: false, msg: 'Rol no encontrado' });

        await updateUserRoleDB(dpi, roleId);

        console.log('================ CAMBIO DE ROL ================');
        console.log(`[USERS] Admin DPI: ${req.user?.udpi || 'N/A'}`);
        console.log(`[USERS] Usuario actualizado DPI: ${dpi}`);
        console.log(`[USERS] Nuevo rol: ${role.role} (${role.id})`);
        console.log('================================================');

        return res.status(200).json({ estado: true, msg: 'Rol actualizado correctamente', user_dpi: dpi, role_id: role.id, role_name: role.role });
    } catch (error) {
        return res.status(500).json({ estado: false, msg: 'Error al actualizar rol', error: error.message });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { dpi } = req.params;
        const { currentPassword, newPassword } = req.body;
        const user = await getUserByDPI(dpi);
        if (!user) return res.status(404).json({ estado: false, msg: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(400).json({ estado: false, msg: "Contraseña incorrecta" });

        const hashed = await bcrypt.hash(newPassword, 10);
        await updatePasswordDB(dpi, hashed);
        res.status(200).json({ estado: true, msg: "Contraseña actualizada" });
    } catch (error) {
        res.status(500).json({ estado: false, msg: "Error al actualizar contraseña", error: error.message });
    }
};
