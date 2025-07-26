-- Fix foreign key constraint in products table to allow user deletion
-- Drop the existing constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_user_id_fkey;

-- Add the constraint back with CASCADE DELETE
ALTER TABLE products ADD CONSTRAINT products_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 