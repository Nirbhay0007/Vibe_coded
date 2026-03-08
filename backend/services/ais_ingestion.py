import random
import math
import time
from typing import List, Dict, Any
from models.schemas import TelemetryPayload

class AISVessel:
    def __init__(self, mmsi: str, lat: float, lon: float, velocity: float, heading: float):
        self.mmsi = mmsi
        self.latitude = lat
        self.longitude = lon
        self.velocity = velocity  # m/s
        self.heading = heading
        
    def step(self, dt: float = 1.0):
        # 1 degree of latitude is ~111,139 meters
        v_lat = self.velocity * math.cos(math.radians(self.heading))
        v_lon = self.velocity * math.sin(math.radians(self.heading))
        
        d_lat = (v_lat * dt) / 111139.0
        d_lon = (v_lon * dt) / (111139.0 * math.cos(math.radians(max(1.0, abs(self.latitude)))))
        
        self.latitude += d_lat
        self.longitude += d_lon
        
        # Keep longitude in bounds
        self.longitude = (self.longitude + 180) % 360 - 180
        
    def to_payload(self) -> TelemetryPayload:
        return TelemetryPayload(
            entity_id=self.mmsi,
            domain="maritime",
            latitude=self.latitude,
            longitude=self.longitude,
            altitude=0.0,
            velocity=self.velocity,
            heading=self.heading
        )

class AISService:
    def __init__(self, vessel_count: int = 220):
        self.vessels: List[AISVessel] = []
        self._initialize_corridors(vessel_count)
        
    def _initialize_corridors(self, total_count: int):
        # Define major choke points
        corridors = [
            {"name": "Suez", "lat": 30.0, "lon": 32.5, "heading": 160},
            {"name": "Panama", "lat": 9.0, "lon": -79.5, "heading": 320},
            {"name": "Malacca", "lat": 1.5, "lon": 103.0, "heading": 300},
            {"name": "Gibraltar", "lat": 36.0, "lon": -5.5, "heading": 270}
        ]
        
        vessels_per_corridor = total_count // len(corridors)
        
        for corridor in corridors:
            for i in range(vessels_per_corridor):
                # Spread vessels along the corridor
                offset_lat = random.uniform(-1.0, 1.0)
                offset_lon = random.uniform(-1.0, 1.0)
                mmsi = f"{random.randint(200000000, 775999999)}"
                
                self.vessels.append(AISVessel(
                    mmsi=mmsi,
                    lat=float(corridor["lat"]) + offset_lat,
                    lon=float(corridor["lon"]) + offset_lon,
                    velocity=random.uniform(5.0, 12.0),
                    heading=float(corridor["heading"]) + random.uniform(-5, 5)
                ))

    def get_vessel_states(self, dt: float = 1.0) -> List[TelemetryPayload]:
        payloads = []
        for vessel in self.vessels:
            vessel.step(dt)
            payloads.append(vessel.to_payload())
        return payloads

# Singleton instance
ais_service = AISService()
