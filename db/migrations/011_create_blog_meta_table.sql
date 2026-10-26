-- Migration: 011_create_blog_meta_table
-- Purpose: Blog article metadata, per-language URLs, translation mapping, and analytics

CREATE TABLE IF NOT EXISTS blog_meta (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL COMMENT 'en, hi, bn',
  translation_of VARCHAR(255) NULL COMMENT 'Canonical English slug for hreflang clustering',
  title VARCHAR(255) NOT NULL,
  meta_description TEXT NOT NULL,
  featured_image VARCHAR(500) NULL,
  author VARCHAR(100) DEFAULT 'Astro Team' NOT NULL,
  views_count BIGINT UNSIGNED DEFAULT 0 NOT NULL,
  lead_clicks BIGINT UNSIGNED DEFAULT 0 NOT NULL,
  is_published BOOLEAN DEFAULT TRUE NOT NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY uk_blog_slug_lang (slug, language),
  INDEX idx_blog_translation (translation_of),
  INDEX idx_blog_published (is_published, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
