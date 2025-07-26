-- Change coordinate columns from DECIMAL to TEXT to store encrypted values
ALTER TABLE users ALTER COLUMN custom_latitude TYPE TEXT;
ALTER TABLE users ALTER COLUMN custom_longitude TYPE TEXT; 