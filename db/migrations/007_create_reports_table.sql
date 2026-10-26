-- Migration: 007_create_reports_table
-- Purpose: Generated paid astrology PDF reports and secure download delivery

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  report_type VARCHAR(50) NOT NULL COMMENT 'kundli, varshphal, matching, numerology',
  language VARCHAR(10) DEFAULT 'en' NOT NULL,
  storage_path VARCHAR(500) NULL,
  download_token VARCHAR(100) NOT NULL,
  download_count INT UNSIGNED DEFAULT 0 NOT NULL,
  expires_at TIMESTAMP NULL,
  status ENUM('pending', 'generating', 'generated', 'failed', 'sent') DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_reports_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  UNIQUE KEY uk_reports_download_token (download_token),
  INDEX idx_reports_order (order_id),
  INDEX idx_reports_user (user_id),
  INDEX idx_reports_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
