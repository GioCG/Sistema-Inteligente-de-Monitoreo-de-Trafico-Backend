USE trafficControlDB;

-- Guarda la placa detectada aunque no exista registrada en vehicles.
-- La columna events.plate conserva la FK hacia vehicles cuando sí existe coincidencia.
ALTER TABLE events
  ADD COLUMN detected_plate VARCHAR(10) NULL AFTER plate;

CREATE INDEX idx_events_detected_plate ON events(detected_plate);

-- Ajuste recomendado para que los eventos sin placa registrada también aparezcan en listados.
DROP PROCEDURE IF EXISTS sp_getEvents;
DELIMITER $$
CREATE PROCEDURE sp_getEvents()
BEGIN
    SELECT
        e.id,
        e.speed,
        e.date,
        e.violation,
        e.traffic_light_status,
        tl.location,
        e.plate,
        e.detected_plate,
        COALESCE(e.plate, e.detected_plate) AS plate_visible,
        u.name AS owner
    FROM events e
    LEFT JOIN traffic_light tl ON e.traffic_light_id = tl.id
    LEFT JOIN vehicles v ON e.plate = v.plate
    LEFT JOIN users u ON v.dpi_user = u.dpi
    ORDER BY e.date DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_getEvidence;
DELIMITER $$
CREATE PROCEDURE sp_getEvidence()
BEGIN
    SELECT
        ev.id,
        ev.image_path,
        e.date,
        e.plate,
        e.detected_plate,
        COALESCE(e.plate, e.detected_plate) AS plate_visible
    FROM evidence ev
    INNER JOIN events e ON ev.event_id = e.id
    ORDER BY e.date DESC;
END$$
DELIMITER ;
