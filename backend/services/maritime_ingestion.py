import random
import math
from datetime import datetime, timezone
from typing import List
from models.schemas import TelemetryPayload

# ── Configuration ──────────────────────────────────────────────────────
# Focus strictly on the Strait of Hormuz for performance and tactical relevance
THEATER_LAT_MIN, THEATER_LAT_MAX = 25.5, 27.0
THEATER_LON_MIN, THEATER_LON_MAX = 55.0, 57.5
NUM_SHIPS = 40
KNOTS_TO_MS = 0.514444
COORD_PRECISION = 5

class MaritimeSimulator:
    """
    Simulates a persistent naval fleet focused on the Strait of Hormuz.
    Reduces fleet volume to 40 ships for WebSocket optimization.
    """

    def __init__(self, count: int = NUM_SHIPS):
        self.ships: List[dict] = []
        
        # Spawn ships randomly within the Strait of Hormuz bounding box
        for _ in range(count):
            mmsi: str = f"MMSI-{random.randint(200000000, 775999999)}"
            lat: float = random.uniform(THEATER_LAT_MIN, THEATER_LAT_MAX)
            lon: float = random.uniform(THEATER_LON_MIN, THEATER_LON_MAX)
            
            # Speed 10 to 25 knots -> convert to m/s
            speed_ms: float = random.uniform(10.0, 25.0) * KNOTS_TO_MS
            # Initial heading randomized, ships will bounce off boundaries
            heading: float = random.uniform(0.0, 360.0)
            
            # Assign a tactical type: Warship, Tanker, or Boat
            ship_types = ['Warship', 'Tanker', 'Boat']
            ship_type = random.choices(ship_types, weights=[0.2, 0.4, 0.4])[0]
            
            self.ships.append({
                "id": mmsi,
                "type": ship_type,
                "lat": lat,
                "lon": lon,
                "speed": speed_ms,
                "heading": heading
            })

    def step(self, dt: float = 1.0) -> List[TelemetryPayload]:
        """
        Calculates the next position for 40 ships at 1Hz.
        Uses WGS84 flat-Earth approximation for speed.
        """
        payloads = []
        
        for s in self.ships:
            # Propagate position
            # Δlat = (v * cos(heading) * dt) / 111139
            # Δlon = (v * sin(heading) * dt) / (111139 * cos(lat))
            
            hdg_rad = math.radians(s["heading"])
            v_lat = s["speed"] * math.cos(hdg_rad)
            v_lon = s["speed"] * math.sin(hdg_rad)
            
            d_lat = (v_lat * dt) / 111139.0
            cos_lat = math.cos(math.radians(s["lat"]))
            d_lon = (v_lon * dt) / (111139.0 * cos_lat)
            
            s["lat"] += d_lat
            s["lon"] += d_lon
            
            # Boundary bouncing logic
            if s["lat"] < THEATER_LAT_MIN or s["lat"] > THEATER_LAT_MAX:
                s["heading"] = (180 - s["heading"]) % 360
                # Nudge back inside to prevent getting stuck
                s["lat"] = max(THEATER_LAT_MIN, min(THEATER_LAT_MAX, s["lat"]))
            
            if s["lon"] < THEATER_LON_MIN or s["lon"] > THEATER_LON_MAX:
                s["heading"] = (360 - s["heading"]) % 360
                # Nudge back inside
                s["lon"] = max(THEATER_LON_MIN, min(THEATER_LON_MAX, s["lon"]))

            payloads.append(TelemetryPayload(
                entity_id=s["id"],
                domain="maritime",
                latitude=round(s["lat"], COORD_PRECISION),
                longitude=round(s["lon"], COORD_PRECISION),
                altitude=0.0,
                velocity=round(s["speed"], 2),
                heading=round(s["heading"], 2),
                name=s["type"]
            ))
            
        return payloads

# Singleton instance
maritime_service = MaritimeSimulator()
