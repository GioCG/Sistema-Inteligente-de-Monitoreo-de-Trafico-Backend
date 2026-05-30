USE trafficControlDB;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL,
  ADD COLUMN IF NOT EXISTS google_sub VARCHAR(128) NULL;

ALTER TABLE fines
  MODIFY description TEXT;

CREATE TABLE IF NOT EXISTS fine_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fine_id INT,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    event_id INT,
    plate VARCHAR(10),
    owner_dpi BIGINT,
    evidence_path VARCHAR(255),
    payment_reference VARCHAR(80),
    payment_method VARCHAR(60),
    payer_name VARCHAR(80),
    card_last4 VARCHAR(4),
    paid_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices opcionales. Si tu motor MySQL/MariaDB no acepta IF NOT EXISTS para índices, créalos manualmente desde tu gestor.
