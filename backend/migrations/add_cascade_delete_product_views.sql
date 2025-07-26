-- Fix foreign key constraint in product_views table to allow user deletion
-- Drop the existing constraint
ALTER TABLE product_views DROP CONSTRAINT IF EXISTS product_views_user_id_fkey;

-- Add the constraint back with SET NULL on delete
ALTER TABLE product_views ADD CONSTRAINT product_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL; 