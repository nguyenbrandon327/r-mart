-- Comprehensive migration to fix all foreign key constraints referencing users table
-- This allows user deletion without constraint violations

-- 1. Create saved_products table if it doesn't exist (missing from schema)
CREATE TABLE IF NOT EXISTS saved_products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- 2. Fix products table constraint (CASCADE DELETE - remove products when user is deleted)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_user_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Fix messages table constraint (CASCADE DELETE - remove messages when user is deleted)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. Fix product_views table constraint (SET NULL - keep analytics but anonymize)
ALTER TABLE product_views DROP CONSTRAINT IF EXISTS product_views_user_id_fkey;
ALTER TABLE product_views ADD CONSTRAINT product_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Note: These tables already have proper CASCADE DELETE constraints:
-- - chats (user1_id, user2_id) 
-- - recently_seen_products (user_id)
-- - saved_products (user_id) - created above 