-- Alternative: CASCADE DELETE product_views when user is deleted
-- Drop the existing constraint
ALTER TABLE product_views DROP CONSTRAINT IF EXISTS product_views_user_id_fkey;

-- Add the constraint back with CASCADE DELETE
ALTER TABLE product_views ADD CONSTRAINT product_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 