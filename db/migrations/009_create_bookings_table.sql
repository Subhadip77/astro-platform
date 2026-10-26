-- Migration: 009_create_bookings_table
-- Purpose: Scheduled consultation appointments between users and astrologers

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_number VARCHAR(64) NOT NULL,
  astrologer_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  birth_profile_id BIGINT UNSIGNED NULL,
  scheduled_at DATETIME NOT NULL,
  duration_minutes INT UNSIGNED DEFAULT 30 NOT NULL,
  meeting_link VARCHAR(500) NULL COMMENT 'Google Meet or consultation link',
  user_notes TEXT NULL,
  status ENUM('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'pending_payment' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_bookings_astrologer FOREIGN KEY (astrologer_id) REFERENCES astrologers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_birth_profile FOREIGN KEY (birth_profile_id) REFERENCES birth_profiles (id) ON DELETE SET NULL,
  UNIQUE KEY uk_bookings_number (booking_number),
  UNIQUE KEY uk_bookings_order (order_id),
  INDEX idx_bookings_astrologer_schedule (astrologer_id, scheduled_at),
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
