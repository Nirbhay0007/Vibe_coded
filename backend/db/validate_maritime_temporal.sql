-- ============================================================================
-- Phase 5: Temporal Maritime Storage — SQL Validation Scripts
-- Spatial DBA (Rendering Specialist cross-role)
--
-- Purpose: Validate that the PostGIS sensor_telemetry table correctly stores
--          maritime coordinates using ST_MakePointM() with WGS84 (SRID 4326).
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. SCHEMA VALIDATION: Confirm PointM geometry type and SRID 4326
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1a. Verify the geometry column is registered in PostGIS metadata
--     Expected: type = 'POINTM', srid = 4326, coord_dimension = 3
SELECT 
    f_table_name,
    f_geometry_column,
    coord_dimension,
    srid,
    type
FROM geometry_columns
WHERE f_table_name = 'sensor_telemetry';

-- 1b. Verify the GIST spatial index exists on the geometry column
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'sensor_telemetry'
  AND indexname = 'idx_sensor_telemetry_geometry';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. DATA INTEGRITY: Validate that stored points use ST_MakePointM correctly
-- ═══════════════════════════════════════════════════════════════════════════════

-- 2a. Extract a sample of maritime telemetry rows decomposed into components
--     ST_X() = Longitude (WGS84 degrees)
--     ST_Y() = Latitude  (WGS84 degrees)
--     ST_M() = Measure   (Unix timestamp)
SELECT 
    id,
    entity_id,
    domain,
    velocity,
    heading,
    ST_X(geometry) AS longitude_wgs84,
    ST_Y(geometry) AS latitude_wgs84,
    ST_M(geometry) AS unix_timestamp_m,
    to_timestamp(ST_M(geometry)) AS human_readable_time,
    ST_SRID(geometry) AS confirmed_srid,
    ST_GeometryType(geometry) AS geometry_type
FROM sensor_telemetry
WHERE domain = 'maritime'
ORDER BY ST_M(geometry) DESC
LIMIT 20;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. WGS84 COMPLIANCE: Ensure no coordinates escape valid geographic bounds
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3a. Find any maritime rows with out-of-bounds longitude or latitude
--     Valid longitude: [-180, 180]
--     Valid latitude:  [-90, 90]
SELECT 
    id,
    entity_id,
    ST_X(geometry) AS longitude,
    ST_Y(geometry) AS latitude,
    ST_M(geometry) AS timestamp_m
FROM sensor_telemetry
WHERE domain = 'maritime'
  AND (
    ST_X(geometry) < -180 OR ST_X(geometry) > 180
    OR ST_Y(geometry) < -90 OR ST_Y(geometry) > 90
  );
-- Expected: 0 rows (all coordinates within WGS84 bounds)

-- 3b. Verify all geometry SRIDs are exactly 4326 (no mixed SRIDs)
SELECT DISTINCT ST_SRID(geometry) AS srid
FROM sensor_telemetry
WHERE domain = 'maritime';
-- Expected: Single row with srid = 4326


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TEMPORAL INTEGRITY: Validate M-coordinate stores valid Unix timestamps
-- ═══════════════════════════════════════════════════════════════════════════════

-- 4a. Check for any NULL or zero M-coordinates (would break Time Machine)
SELECT COUNT(*) AS null_or_zero_m_count
FROM sensor_telemetry
WHERE domain = 'maritime'
  AND (ST_M(geometry) IS NULL OR ST_M(geometry) = 0);
-- Expected: 0

-- 4b. Verify temporal ordering makes sense (no future timestamps > now + 60s)
SELECT COUNT(*) AS future_timestamp_count
FROM sensor_telemetry
WHERE domain = 'maritime'
  AND ST_M(geometry) > EXTRACT(EPOCH FROM now()) + 60;
-- Expected: 0

-- 4c. Get the time range of all maritime data
SELECT 
    to_timestamp(MIN(ST_M(geometry))) AS earliest_maritime_record,
    to_timestamp(MAX(ST_M(geometry))) AS latest_maritime_record,
    COUNT(*) AS total_maritime_rows,
    COUNT(DISTINCT entity_id) AS unique_vessels
FROM sensor_telemetry
WHERE domain = 'maritime';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. TIME MACHINE READINESS: Validate snapshot reconstruction capability
-- ═══════════════════════════════════════════════════════════════════════════════

-- 5a. Simulate a snapshot reconstruction at the latest recorded timestamp
--     This mirrors the query used by /api/history/snapshot
WITH ranked AS (
    SELECT
        entity_id,
        domain,
        velocity,
        heading,
        ST_X(geometry) AS longitude,
        ST_Y(geometry) AS latitude,
        ST_M(geometry) AS ts,
        ROW_NUMBER() OVER (
            PARTITION BY entity_id
            ORDER BY ST_M(geometry) DESC
        ) AS rn
    FROM sensor_telemetry
    WHERE domain = 'maritime'
      AND ST_M(geometry) <= EXTRACT(EPOCH FROM now())
)
SELECT entity_id, domain, longitude, latitude, velocity, heading,
       to_timestamp(ts) AS position_time
FROM ranked
WHERE rn = 1
ORDER BY entity_id
LIMIT 10;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. PERFORMANCE: Check index usage on spatial queries
-- ═══════════════════════════════════════════════════════════════════════════════

-- 6a. Explain a typical Time Machine query to confirm GIST index is used
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    entity_id,
    ST_X(geometry) AS lon,
    ST_Y(geometry) AS lat,
    ST_M(geometry) AS ts
FROM sensor_telemetry
WHERE domain = 'maritime'
  AND ST_M(geometry) >= EXTRACT(EPOCH FROM now()) - 3600
  AND ST_M(geometry) <= EXTRACT(EPOCH FROM now())
ORDER BY ST_M(geometry) DESC
LIMIT 100;
