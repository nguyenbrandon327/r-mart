-- Create campus_locations table with UCR housing data
CREATE TABLE IF NOT EXISTS campus_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert UCR housing locations
INSERT INTO campus_locations (name, latitude, longitude) VALUES
    ('Aberdeen-Inverness', 33.97841009690865, -117.3255630908025),
    ('Dundee', 33.97875834795599, -117.32441248941895),
    ('Lothian', 33.975949027902736, -117.32251305060348),
    ('Pentland Hills', 33.977881727614516, -117.32240306677893),
    ('Bannockburn Village', 33.97762364159829, -117.33147234167862),
    ('Falkirk', 33.98043908008703, -117.3317568376434),
    ('Glen Mor', 33.976621816198524, -117.32051349429331),
    ('North District', 33.98005932637361, -117.32682120371766),
    ('North District 2', 33.980012563393096, -117.33002713103215),
    ('Stonehaven', 33.984025285454614, -117.33190955166202),
    ('The Plaza', 33.978572024098504, -117.33373378424167),
    ('Oban Family Housing', 33.97878868463515, -117.33218431443102),
    ('UCR Main Campus (default)', 33.97397723944315, -117.32815785779336)
ON CONFLICT (name) DO NOTHING;

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS campus_locations_name_idx ON campus_locations(name); 