---
description: Detect Jamming Workflow
---

# Workflow: /detect-jamming
# Description: Scans aircraft telemetry for GPS integrity drops to map jamming zones.

## Step 1: Signal Audit
- Query the `aircraft_telemetry` table for all records within the last 15 minutes.
- Filter for aircraft where the **NIC (Navigation Integrity Category)** value has dropped by > 10% from its baseline.

## Step 2: Triangulation
- Identify clusters of aircraft experiencing simultaneous NIC drops.
- Calculate the "Radio Horizon" intersection for these aircraft to estimate the jamming source coordinates.

## Step 3: Analytics Mapping
- Map the affected area using **Uber H3 (Resolution 7)** hexagons.
- Store the event in the `interference_log` table with start/stop timestamps.

## Step 4: Tactical Visualization
- Generate a red holographic heatmap artifact in Cesium.
- **Vibe Rule:** Use a neon-red pulsing shader for the H3 cells to indicate high-threat EW (Electronic Warfare) zones.
- Create an automated "High-Probability Strike Alert" summary in the mission log.