'use strict';

import { db } from '../../configs/mysql.js';

export const findUserByEmailOrUsername = async (email, username) => {
    const [rows] = await db().query(
        `SELECT u.*, r.role 
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         WHERE u.email = ? OR u.username = ?
         LIMIT 1`,
        [email || '', username || '']
    );
    return rows[0];
};
