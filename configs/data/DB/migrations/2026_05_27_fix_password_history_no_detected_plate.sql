USE trafficcontroldb;

-- Columnas necesarias para restaurar contraseña.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL;

-- Tabla de historial de multas pagadas.
CREATE TABLE IF NOT EXISTS fine_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fine_id INT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
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

-- Compatibilidad por si una versión anterior creó fine_history con otros nombres.
ALTER TABLE fine_history
  ADD COLUMN IF NOT EXISTS owner_dpi BIGINT NULL,
  ADD COLUMN IF NOT EXISTS evidence_path VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(60) NULL,
  ADD COLUMN IF NOT EXISTS payer_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4) NULL,
  ADD COLUMN IF NOT EXISTS paid_at DATETIME NULL;

