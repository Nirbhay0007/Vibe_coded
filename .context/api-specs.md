# API Specifications: Global Sensor Ingestion

## 1. Aviation: ADS-B Exchange (ADSBx)
- **Endpoint**: `https://adsbexchange.com/api/aircraft/json/`
- **Data Format**: JSON
- **Key Fields**: 
  - `hex`: Unique ICAO identifier.
  - `lat`, `lon`: Geodetic coordinates.
  - `alt_baro`: Barometric altitude in feet.
  - `nic`: Navigation Integrity Category (Trigger for Jamming Alerts).

## 2. Maritime: AIS Hub / MarineTraffic
- **Protocol**: NMEA 0183 or JSON via REST.
- **Key Message Types**:
  - `Type 1/2/3`: Position Reports (Live movement).
  - `Type 5`: Static and Voyage Data (Destination/ETA).
- **Transformation**: All knots (SOG) must be converted to meters per second for the physics engine.

## 3. Orbital: Space-Track (TLE)
- **Endpoint**: `https://www.space-track.org/`
- **Format**: Two-Line Element Set (TLE).
- **Processing**: Use the `SGP4` library to propagate TLEs into ECEF coordinates every 10 seconds.

## 4. Disaster Layer: NASA FIRMS
- **Data**: MODIS/VIIRS thermal anomalies.
- **Output**: GeoJSON polygons for active fire/explosion pings.