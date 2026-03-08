# Geospatial Indexing: S2 vs H3 Strategy

## Google S2 Geometry (Primary for Entity Tracking)
- **Usage**: Use for satellite footprint calculation and aircraft proximity alerts.
- **Implementation**: Map entities to 64-bit CellIDs.
- **Logic**: Use the Hilbert Space-Filling Curve to collapse 2D coordinates into a sortable 1D index for sub-millisecond range queries.

## Uber H3 (Secondary for Heatmaps/Analytics)
- **Usage**: Use for regional GPS Jamming "heatmaps" and maritime congestion zones.
- **Resolution**: Use Resolution 7 (approx. 1.2km) for global surveillance views.
- **Logic**: Hexagonal hierarchical indexing to prevent boundary distortion at the poles.

## Coordination Logic
- **Search**: When an agent performs a "Detect Jamming" query, it should first filter by S2 CellID to find relevant aircraft, then aggregate their NIC drops into H3 hexagons for visualization.