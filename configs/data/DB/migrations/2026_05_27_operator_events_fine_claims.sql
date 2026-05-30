USE trafficcontroldb;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by_dpi BIGINT NULL AFTER plate,
  ADD COLUMN IF NOT EXISTS created_by_role_id INT NULL AFTER created_by_dpi,
  ADD COLUMN IF NOT EXISTS manual_reason TEXT NULL AFTER created_by_role_id;

ALTER TABLE fines
  MODIFY description TEXT NULL;

CREATE TABLE IF NOT EXISTS fine_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fine_id INT NULL,
    event_id INT NULL,
    plate VARCHAR(20) NULL,
    claimant_dpi BIGINT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    resolution TEXT NULL,
    reviewed_by BIGINT NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
