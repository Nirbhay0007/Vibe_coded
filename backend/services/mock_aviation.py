import asyncio
import math
import random
from typing import List, Dict, Any
from models.schemas import TelemetryPayload

class MockAviationService:
    def __init__(self):
        self.fleet_size = 150
        self.planes = []
        self._initialize_fleet()
    
    def _initialize_fleet(self):
        """
        Creates a mock fleet with trajectories over key areas, notably the
        US Northeast to trigger the EW Jamming layer.
        """
        for i in range(self.fleet_size):
            # Focus on the Gulf Region roughly
            lat = random.uniform(20.0, 30.0)
            lon = random.uniform(45.0, 60.0)
            
            # Commercial airliner speeds around 200-250 m/s
            velocity = random.uniform(200.0, 250.0)
            heading = random.uniform(0.0, 360.0)
            alt = random.uniform(9000.0, 12000.0)
            
            hex_id = f"MOCK{i:04X}"
            
            self.planes.append({
                "id": hex_id,
                "lat": lat,
                "lon": lon,
                "heading": heading,
                "velocity": velocity,
                "alt": alt
            })
            
    async def fetch_live_states(self, dt: float = 1.0) -> List[TelemetryPayload]:
        """
        Steps the simulation forward by dt seconds and returns TelemetryPayloads.
        """
        payloads = []
        R = 6378137.0  # Earth radius in meters
        
        for p in self.planes:
            dist = p["velocity"] * dt
            hdg_rad = math.radians(p["heading"])
            lat_rad = math.radians(p["lat"])
            
            # Simplified spherical movement (sufficient for visualization)
            p["lat"] += math.degrees((dist * math.cos(hdg_rad)) / R)
            p["lon"] += math.degrees((dist * math.sin(hdg_rad)) / (R * math.cos(lat_rad)))
            
            # Simple bounds check, bounce off edges (Gulf bounds)
            if p["lat"] > 35.0 or p["lat"] < 15.0:
                p["heading"] = (180.0 - p["heading"]) % 360.0
            if p["lon"] < 40.0 or p["lon"] > 65.0:
                p["heading"] = (360.0 - p["heading"]) % 360.0
                
            # Phase 3b: Inject Jamming/Jitter over the Gulf / Strait of Hormuz
            # Box: 25 < lat < 27 and 53 < lon < 57
            jitter = 0.0
            nic = 10
            if 25 < p["lat"] < 27 and 53 < p["lon"] < 57:
                jitter = random.uniform(15.0, 30.0)
                nic = random.randint(1, 3)
                
            payloads.append(TelemetryPayload(
                entity_id=p["id"],
                domain="aviation",
                latitude=p["lat"],
                longitude=p["lon"],
                altitude=p["alt"],
                velocity=p["velocity"],
                heading=p["heading"],
                jitter=jitter,
                nic=nic
            ))
            
        return payloads

    async def close(self):
        pass

mock_aviation_service = MockAviationService()
