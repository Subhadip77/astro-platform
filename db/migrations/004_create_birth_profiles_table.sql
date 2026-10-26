-- Migration: 004_create_birth_profiles_table
-- Purpose: Saved user astrological profiles with encrypted birth data

CREATE TABLE IF NOT EXISTS birth_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  relationship VARCHAR(50) DEFAULT 'self' NOT NULL,
  encrypted_dob TEXT NOT NULL COMMENT 'AES-256-GCM encrypted date of birth',
  encrypted_tob TEXT NOT NULL COMMENT 'AES-256-GCM encrypted time of birth',
  place_of_birth VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  timezone DECIMAL(4, 2) DEFAULT 5.50 NOT NULL,
  ayanamsa INT DEFAULT 1 NOT NULL COMMENT '1 = Lahiri default',
  consent_given BOOLEAN DEFAULT TRUE NOT NULL,
  consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_birth_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_birth_profiles_user (user_id),
  INDEX idx_birth_profiles_relationship (relationship)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
