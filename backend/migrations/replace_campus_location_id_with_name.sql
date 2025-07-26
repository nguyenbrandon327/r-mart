-- Migration: Replace campus_location_id with campus_location_name
-- This removes the dependency on campus_locations table

-- Add the new campus_location_name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus_location_name VARCHAR(255);

-- Populate the new column with names from existing data
UPDATE users 
SET campus_location_name = cl.name
FROM campus_locations cl 
WHERE users.campus_location_id = cl.id;

-- Set default for users without location
UPDATE users 
SET campus_location_name = 'UCR Main Campus (default)'
WHERE campus_location_name IS NULL AND location_type = 'on_campus';

-- Drop the old foreign key constraint and column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_campus_location_id_fkey;
ALTER TABLE users DROP COLUMN IF EXISTS campus_location_id;

-- Now we can drop the campus_locations table since it's no longer needed
DROP TABLE IF EXISTS campus_locations; 