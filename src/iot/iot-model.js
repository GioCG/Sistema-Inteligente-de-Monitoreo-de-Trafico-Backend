'use strict';

import { db } from '../../configs/mysql.js';

export const ensureTrafficLightExists = async (trafficLightId = 1) => {
  const id = Number(trafficLightId) || 1;
  const [rows] = await db().query('SELECT id FROM traffic_light WHERE id = ?', [id]);

  if (rows.length > 0) {
    return id;
  }

  await db().query(
    'INSERT INTO traffic_light(id, location, status) VALUES(?, ?, ?)',
    [id, 'Punto de control IoT', 'GREEN']
  );

  return id;
};

export const createIotSpeedEvent = async ({
  speed,
  traffic_light_status,
  violation,
  traffic_light_id,
  plate,
  detected_plate
}) => {
  try {
    const [result] = await db().query(
      `INSERT INTO events
        (speed, date, traffic_light_status, violation, traffic_light_id, plate, detected_plate)
       VALUES (?, NOW(), ?, ?, ?, ?, ?)`,
      [speed, traffic_light_status, violation, traffic_light_id, plate, detected_plate]
    );

    return result;
  } catch (error) {
    // Compatibilidad si la base todavía no tiene la columna detected_plate.
    if (error.message && error.message.includes('detected_plate')) {
      console.warn('[IOT] La columna detected_plate no existe. Reintentando sin detected_plate. Ejecuta migration_iot_speed_plate.sql para habilitarla.');
      const [result] = await db().query(
        `INSERT INTO events
          (speed, date, traffic_light_status, violation, traffic_light_id, plate)
         VALUES (?, NOW(), ?, ?, ?, ?)`,
        [speed, traffic_light_status, violation, traffic_light_id, plate]
      );
      return result;
    }

    throw error;
  }
};

export const createIotEvidence = async ({ image_path, event_id }) => {
  const [result] = await db().query(
    'INSERT INTO evidence(image_path, event_id) VALUES(?, ?)',
    [image_path, event_id]
  );
  return result;
};

export const createIotFine = async ({ amount, description, event_id }) => {
  const [result] = await db().query(
    'INSERT INTO fines(amount, description, event_id) VALUES(?, ?, ?)',
    [amount, description, event_id]
  );
  return result;
};
