import random
import math
import uuid
import time
from typing import List, Dict, Any

class MockEntity:
    def __init__(self, domain: str, lat: float, lon: float, alt: float, velocity: float, heading: float):
        self.entity_id = f"{'FLT' if domain == 'aviation' else 'SHP'}-{uuid.uuid4().hex[:8].upper()}"
        self.domain = domain
        self.latitude = lat
        self.longitude = lon
        self.altitude = alt
        self.velocity = velocity
        self.heading = heading
        
    def step(self, dt: float = 1.0):
        # Update position based on velocity (m/s) and heading (degrees)
        # 1 degree of latitude is ~111,139 meters
        # 1 degree of longitude is ~111,139 * cos(latitude) meters
        v_lat = self.velocity * math.cos(math.radians(self.heading))
        v_lon = self.velocity * math.sin(math.radians(self.heading))
        
        d_lat = (v_lat * dt) / 111139.0
        d_lon = (v_lon * dt) / (111139.0 * math.cos(math.radians(self.latitude)))
        
        self.latitude += d_lat
        self.longitude += d_lon
        
        # Add a tiny bit of random noise to heading to make paths less perfectly straight
        self.heading += random.uniform(-1.0, 1.0)
        self.heading %= 360
        
        # Keep lat/lon in valid bounds
        self.latitude = max(-90.0, min(90.0, self.latitude))
        self.longitude = (self.longitude + 180) % 360 - 180
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_id": self.entity_id,
            "domain": self.domain,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "altitude": self.altitude,
            "velocity": self.velocity,
            "heading": self.heading
        }

class MockSensorManager:
    def __init__(self):
        self.entities: List[MockEntity] = []
        self._initialize_aircraft()
        self._initialize_ships()
        
    def _initialize_aircraft(self, count: int = 100):
        for _ in range(count):
            # US/Atlantic corridor roughly
            lat = random.uniform(25.0, 50.0)
            lon = random.uniform(-125.0, -65.0)
            
            # Europe / Asia roughly
            if random.random() > 0.5:
                lat = random.uniform(35.0, 60.0)
                lon = random.uniform(-10.0, 140.0)
                
            alt = random.uniform(10000.0, 12000.0)
            velocity = random.uniform(220.0, 280.0)  # ~250 m/s
            heading = random.uniform(0, 360)
            
            self.entities.append(MockEntity(
                domain="aviation",
                lat=lat,
                lon=lon,
                alt=alt,
                velocity=velocity,
                heading=heading
            ))
            
    def _initialize_ships(self, count: int = 100):
        for _ in range(count):
            # Atlantic Ocean
            lat = random.uniform(-40.0, 40.0)
            lon = random.uniform(-60.0, -20.0)
            
            # Pacific Ocean
            if random.random() > 0.5:
                lat = random.uniform(-40.0, 40.0)
                lon = random.uniform(140.0, 240.0) # 140 to 180, then wraps but modulo handles it at step
                if lon > 180:
                    lon -= 360
                    
            alt = 0.0
            velocity = random.uniform(5.0, 15.0)  # ~10 m/s
            heading = random.uniform(0, 360)
            
            self.entities.append(MockEntity(
                domain="maritime",
                lat=lat,
                lon=lon,
                alt=alt,
                velocity=velocity,
                heading=heading
            ))

    def get_updates(self, dt: float = 1.0) -> List[Dict[str, Any]]:
        """
        Advances all entities by dt seconds and returns their current state.
        """
        results = []
        for entity in self.entities:
            entity.step(dt)
            results.append(entity.to_dict())
        return results

# Singleton instance
sensor_manager = MockSensorManager()
