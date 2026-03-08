-- Enable the PostGIS extension for geospatial capabilities
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the sensor_telemetry table with support for 4D "Time Machine" logic
CREATE TABLE IF NOT EXISTS sensor_telemetry (
    id SERIAL PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL, -- e.g., 'aviation', 'maritime'
    velocity FLOAT,
    heading FLOAT,
    jitter FLOAT DEFAULT 0.0,
    nic INTEGER DEFAULT 10,
    -- Store longitude, latitude and Unix timestamp together: ST_MakePointM(lon, lat, timestamp)
    geometry GEOMETRY(PointM, 4326) NOT NULL
);

-- Create a GIST spatial index on the geometry column to ensure sub-second retrieval
CREATE INDEX IF NOT EXISTS idx_sensor_telemetry_geometry 
ON sensor_telemetry USING GIST (geometry);
