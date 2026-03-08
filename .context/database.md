# Database Schema: PostGIS Temporal Foundation

## Core Objective
Implement a high-throughput spatial database using PostgreSQL + PostGIS. All trajectories must be stored as 4D objects (Lat, Long, Alt, Time).

## Table: aircraft_telemetry
- **icao24**: VARCHAR(6) PRIMARY KEY (ICAO hex identifier)
- **callsign**: VARCHAR(8)
- **registration**: VARCHAR(20)
- **geom**: GEOMETRY(PointZ, 4326)
- **trajectory**: GEOMETRY(LineStringZM, 4326) 
  - *Note*: Use ST_MakePointM() to append time as the 'M' coordinate for historical scrubbing.

## Table: maritime_telemetry
- **mmsi**: INTEGER PRIMARY KEY (Maritime Mobile Service Identity)
- **ship_name**: VARCHAR(128)
- **vessel_type**: VARCHAR(50)
- **geom**: GEOMETRY(Point, 4326)
- **heading**: FLOAT (Degrees)

## Strategic Constraints
- **Coordinate Reference System (CRS)**: Strictly use SRID 4326 (WGS84) for ingestion.
- **Indexing**: Use GIST indexes on 'geom' and 'trajectory' columns.
- **Vacuuming**: Automate aggressive autovacuuming for high-velocity telemetry updates.