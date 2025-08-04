-- Add slug column to products table for SEO-friendly URLs
-- This will store URL-safe versions of product names
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Create index for better performance on slug lookups
CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);