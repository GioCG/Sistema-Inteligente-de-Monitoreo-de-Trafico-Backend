'use strict';

import mysql from 'mysql2/promise';

let pool;

export const dbConnection = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('MySQL conectado correctamente');
  } catch (error) {
    console.error('Error en conexión', error);
    process.exit(1);
  }
};

export const db = () => pool;