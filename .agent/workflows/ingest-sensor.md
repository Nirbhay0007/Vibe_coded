---
description: Ingest Sensor Data
---

# Workflow: /ingest-sensor
# Description: Connects to global aviation/maritime feeds and populates PostGIS.

## Step 1: Acquisition
- Trigger the data fetcher for **ADSBx Enterprise API** (Aviation) or **AIS Hub** (Maritime).
- For Aviation: Filter for active state vectors within the target bounding box.
- For Maritime: Use the 'Type 1' Position Report schema.

## Step 2: Transformation (Geospatial Logic)
- **Coordinate Check:** Ensure all incoming Lat/Long are mapped to the `WGS84` ellipsoid.
- **Altitude normalization:** Convert barometric altitude to geometric height (meters) for Cesium rendering.
- **Timestamping:** Convert all source timestamps to ISO 8601 UTC.

## Step 3: Database Committal
- Execute a `UPSERT` on the `telemetry` tables.
- Use `ST_MakePointM()` to append the 'M' (Measure) coordinate for temporal trajectory reconstruction.
- Assign the entity to its corresponding **S2 CellID** for rapid proximity indexing.

## Step 4: UI Handover
- Generate a `CZML` packet representing the new positions.
- Push the update to the React state to slewing the camera or update model transforms in the viewer.