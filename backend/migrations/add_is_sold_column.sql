-- Add is_sold column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE; 