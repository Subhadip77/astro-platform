-- Migration: 008_create_astrologers_table
-- Purpose: Verified astrologer partner profiles with configurable commission rates

CREATE TABLE IF NOT EXISTS astrologers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  bio TEXT NULL,
  languages JSON NOT NULL COMMENT 'Array of language codes: ["en", "hi", "bn"]',
  specialities JSON NOT NULL COMMENT 'Array of specialities: ["Vedic", "KP", "Vastu", "Numerology"]',
  experience_years INT UNSIGNED DEFAULT 1 NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  rate_per_consultation DECIMAL(10, 2) NOT NULL COMMENT 'Consultation fee in INR',
  commission_percentage DECIMAL(5, 2) DEFAULT 20.00 NOT NULL COMMENT 'Configurable platform commission percentage (0-100)',
  profile_photo_url VARCHAR(500) NULL,
  rating_avg DECIMAL(3, 2) DEFAULT 5.00 NOT NULL,
  total_reviews INT UNSIGNED DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_astrologers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY uk_astrologers_user (user_id),
  INDEX idx_astrologers_verified (is_verified),
  INDEX idx_astrologers_active (is_active),
  INDEX idx_astrologers_rating (rating_avg)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
