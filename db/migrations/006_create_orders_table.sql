-- Migration: 006_create_orders_table
-- Purpose: Payment orders for paid reports and consultations

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  order_number VARCHAR(64) NOT NULL,
  razorpay_order_id VARCHAR(100) NULL,
  razorpay_payment_id VARCHAR(100) NULL,
  razorpay_signature VARCHAR(255) NULL,
  amount DECIMAL(10, 2) NOT NULL COMMENT 'Amount in INR',
  currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
  item_type ENUM('report', 'consultation') NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  status ENUM('created', 'attempted', 'paid', 'failed', 'refunded') DEFAULT 'created' NOT NULL,
  payment_method VARCHAR(50) NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  metadata JSON NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  UNIQUE KEY uk_orders_order_number (order_number),
  UNIQUE KEY uk_orders_rzp_order_id (razorpay_order_id),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
