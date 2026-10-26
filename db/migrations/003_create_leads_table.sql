-- Migration: 003_create_leads_table
-- Purpose: Free tool leads with consent and encrypted birth details

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  encrypted_dob TEXT NOT NULL COMMENT 'AES-256-GCM encrypted date of birth',
  encrypted_tob TEXT NOT NULL COMMENT 'AES-256-GCM encrypted time of birth',
  place_of_birth VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  timezone DECIMAL(4, 2) DEFAULT 5.50 NOT NULL,
  language VARCHAR(10) DEFAULT 'en' NOT NULL,
  consent_given BOOLEAN DEFAULT TRUE NOT NULL,
  consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  source VARCHAR(100) DEFAULT 'free_kundli' NOT NULL,
  utm_source VARCHAR(100) NULL,
  utm_medium VARCHAR(100) NULL,
  utm_campaign VARCHAR(100) NULL,
  status ENUM('new', 'contacted', 'converted', 'dropped') DEFAULT 'new' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_leads_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_leads_whatsapp (whatsapp_number),
  INDEX idx_leads_status (status),
  INDEX idx_leads_source (source),
  INDEX idx_leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
