-- Add location fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_type VARCHAR(20) CHECK (location_type IN ('on_campus', 'off_campus'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_location_in_profile BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus_location_id INTEGER REFERENCES campus_locations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_longitude DECIMAL(11, 8);

-- Set default location to UCR Main Campus for existing users
UPDATE users 
SET location_type = 'on_campus', 
    campus_location_id = (SELECT id FROM campus_locations WHERE name = 'UCR Main Campus (default)' LIMIT 1)
WHERE location_type IS NULL; 