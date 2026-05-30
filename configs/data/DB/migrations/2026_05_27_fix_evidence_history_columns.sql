USE trafficControlDB;

-- Repara o crea historial de multas con columnas usadas por el backend.
CREATE TABLE IF NOT EXISTS fine_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fine_id INT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NULL,
    event_id INT NULL,
    plate VARCHAR(20) NULL,
    owner_dpi BIGINT NULL,
    evidence_path VARCHAR(255) NULL,
    payment_reference VARCHAR(100) NULL,
    payment_method VARCHAR(60) NULL,
    payer_name VARCHAR(100) NULL,
    card_last4 VARCHAR(4) NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Si tu MySQL/MariaDB no acepta IF NOT EXISTS en ALTER, omite las líneas que ya existan.
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS fine_id INT NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS description TEXT NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS event_id INT NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS plate VARCHAR(20) NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS owner_dpi BIGINT NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS evidence_path VARCHAR(255) NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100) NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS payment_method VARCHAR(60) NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS payer_name VARCHAR(100) NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4) NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS paid_at DATETIME NULL;
ALTER TABLE fine_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Si tienes columnas antiguas como user_dpi o paid_by_dpi, copia sus datos manualmente a owner_dpi.

-- Asegura que el campo soporte rutas largas.
ALTER TABLE evidence MODIFY image_path VARCHAR(255);
ALTER TABLE fines MODIFY description TEXT;
