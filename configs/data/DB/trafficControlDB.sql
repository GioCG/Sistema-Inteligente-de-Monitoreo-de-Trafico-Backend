CREATE DATABASE IF NOT EXISTS trafficControlDB;
USE trafficControlDB;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL
);

INSERT INTO roles (role) VALUES
('ADMIN_ROLE'), 
('OPERATOR_ROLE'),
('SECURITY_ROLE'),
('CITIZEN_ROLE'),
('SYSTEM_ROLE');

CREATE TABLE traffic_light (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE users (
    dpi BIGINT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    username VARCHAR(20) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(40) NOT NULL,
    estate BOOLEAN DEFAULT TRUE,
    role_id INT,
    CONSTRAINT fk_role_user
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
);

CREATE TABLE vehicles (
    plate VARCHAR(10) PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    color VARCHAR(20) NOT NULL,
    dpi_user BIGINT,
    CONSTRAINT fk_user_vehicle
    FOREIGN KEY (dpi_user)
    REFERENCES users(dpi)
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    speed FLOAT NOT NULL,
    date DATETIME NOT NULL,
    traffic_light_status VARCHAR(20),
    violation BOOLEAN NOT NULL,
    traffic_light_id INT,
    plate VARCHAR(10),

    CONSTRAINT fk_traffic_light
    FOREIGN KEY (traffic_light_id)
    REFERENCES traffic_light(id),

    CONSTRAINT fk_vehicle
    FOREIGN KEY (plate)
    REFERENCES vehicles(plate)
);

CREATE TABLE evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(100),
    event_id INT,

    CONSTRAINT fk_event_evidence
    FOREIGN KEY (event_id)
    REFERENCES events(id)
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_plate ON vehicles(plate);
CREATE INDEX idx_event_date ON events(date);
CREATE INDEX idx_events_plate ON events(plate);
CREATE INDEX idx_events_traffic_light ON events(traffic_light_id);

-- ===========================================CRUD USER========================================
-- ============================================================================================
DELIMITER $$
CREATE PROCEDURE sp_createUser(
    IN p_dpi BIGINT,
    IN p_name VARCHAR(60),
    IN p_username VARCHAR(20),
    IN p_email VARCHAR(50),
    IN p_password VARCHAR(255),
    IN p_address VARCHAR(40),
    IN p_role_id INT
)
BEGIN
    INSERT INTO users(dpi, name, username, email, password, address, role_id)
    VALUES(p_dpi, p_name, p_username, p_email, p_password, p_address, p_role_id);
END$$
DELIMITER ;

ñ
DELIMITER $$
CREATE PROCEDURE sp_getUserByDPI(IN p_dpi BIGINT)
BEGIN
    SELECT 
        u.*,
        r.role
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.dpi = p_dpi;
END$$
DELIMITER ;


DELIMITER $$
CREATE PROCEDURE sp_updatePassword(
    IN p_dpi BIGINT,
    IN p_password VARCHAR(255)
)
BEGIN
    UPDATE users
    SET password = p_password
    WHERE dpi = p_dpi;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_deleteUser(IN p_dpi BIGINT)
BEGIN
    UPDATE users
    SET estado = FALSE
    WHERE dpi = p_dpi;
END$$
DELIMITER ;

-- ===========================================CRUD VEHICLE========================================
-- ============================================================================================

DELIMITER $$
CREATE PROCEDURE sp_createVehicle(
    IN p_plate VARCHAR(10),
    IN p_type VARCHAR(20),
    IN p_color VARCHAR(20),
    IN p_dpi BIGINT
)
BEGIN
    INSERT INTO vehicles(plate, type, color, dpi_user)
    VALUES(p_plate, p_type, p_color, p_dpi);
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_getVehicles()
BEGIN
    SELECT 
        v.plate,
        v.type,
        v.color,
        u.name AS owner
    FROM vehicles v
    INNER JOIN users u ON v.dpi_user = u.dpi;
END$$
DELIMITER ;

-- ===========================================CRUD TRAFIC LIGHT========================================
-- ====================================================================================================
DELIMITER $$
CREATE PROCEDURE sp_getTrafficLights()
BEGIN
    SELECT * FROM traffic_light;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_updateTrafficLight(
    IN p_id INT,
    IN p_location VARCHAR(50),
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE traffic_light 
    SET location = p_location, status = p_status 
    WHERE id = p_id;
END$$
DELIMITER ;
-- ===========================================CRUD EVENTS========================================
-- ==============================================================================================
DELIMITER $$
CREATE PROCEDURE sp_createEvent(
    IN p_speed FLOAT,
    IN p_date DATETIME,
    IN p_status VARCHAR(20),
    IN p_violation BOOLEAN,
    IN p_traffic_light_id INT,
    IN p_plate VARCHAR(10)
)
BEGIN
    INSERT INTO events(speed, date, traffic_light_status, violation, traffic_light_id, plate)
    VALUES(p_speed, p_date, p_status, p_violation, p_traffic_light_id, p_plate);
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_getEvents()
BEGIN
    SELECT 
        e.id,
        e.speed,
        e.date,
        e.violation,
        tl.location,
        v.plate,
        u.name AS owner
    FROM events e
    INNER JOIN traffic_light tl ON e.traffic_light_id = tl.id
    INNER JOIN vehicles v ON e.plate = v.plate
    INNER JOIN users u ON v.dpi_user = u.dpi;
END$$
DELIMITER ;

-- ===========================================CRUD EVENTS========================================
-- ==============================================================================================
DELIMITER $$
CREATE PROCEDURE sp_getEvidence()
BEGIN
    SELECT 
        ev.id,
        ev.image_path,
        e.date,
        v.plate
    FROM evidence ev
    INNER JOIN events e ON ev.event_id = e.id
    INNER JOIN vehicles v ON e.plate = v.plate;
END$$
DELIMITER ;
