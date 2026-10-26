-- Migration: 005_create_api_cache_table
-- Purpose: Persistent database cache for external AstrologyAPI calculations

CREATE TABLE IF NOT EXISTS api_cache (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of endpoint and query parameters',
  endpoint VARCHAR(100) NOT NULL,
  language VARCHAR(10) DEFAULT 'en' NOT NULL,
  response_data JSON NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY uk_api_cache_key (cache_key),
  INDEX idx_api_cache_endpoint (endpoint),
  INDEX idx_api_cache_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
