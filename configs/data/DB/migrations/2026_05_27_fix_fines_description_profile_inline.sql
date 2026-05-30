USE trafficcontroldb;

-- Evita el error ER_DATA_TOO_LONG cuando la ESP32-CAM crea una multa con descripción larga.
ALTER TABLE fines
  MODIFY description TEXT NOT NULL;
