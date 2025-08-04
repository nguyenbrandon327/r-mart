-- Add ulid column to chats table for secure URL identification
-- This will store ULID identifiers instead of exposing database IDs in URLs
ALTER TABLE chats ADD COLUMN IF NOT EXISTS ulid VARCHAR(26) UNIQUE;

-- Create index for better performance on ulid lookups
CREATE INDEX IF NOT EXISTS chats_ulid_idx ON chats(ulid);