-- Migration: 010_create_commissions_table
-- Purpose: Financial commission ledger tracking platform fee and astrologer payouts

CREATE TABLE IF NOT EXISTS commissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  astrologer_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL COMMENT 'Gross consultation amount paid by user',
  commission_rate DECIMAL(5, 2) NOT NULL COMMENT 'Snapshot of astrologer commission percentage at booking',
  platform_fee DECIMAL(10, 2) NOT NULL COMMENT 'Platform share = total_amount * (commission_rate / 100)',
  astrologer_payout DECIMAL(10, 2) NOT NULL COMMENT 'Net payout = total_amount - platform_fee',
  payout_status ENUM('unpaid', 'processing', 'paid', 'held') DEFAULT 'unpaid' NOT NULL,
  payout_reference VARCHAR(100) NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_commissions_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE RESTRICT,
  CONSTRAINT fk_commissions_astrologer FOREIGN KEY (astrologer_id) REFERENCES astrologers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_commissions_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT,
  UNIQUE KEY uk_commissions_booking (booking_id),
  INDEX idx_commissions_astrologer_payout (astrologer_id, payout_status),
  INDEX idx_commissions_payout_status (payout_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
