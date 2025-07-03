-- Add CASCADE DELETE to messages table sender_id foreign key
-- First drop the existing constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Add the constraint back with CASCADE DELETE
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE; 