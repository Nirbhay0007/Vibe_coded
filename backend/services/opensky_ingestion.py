import asyncio
import httpx
from typing import List, Optional
from models.schemas import TelemetryPayload

class OpenSkyService:
    def __init__(self):
        self.url = "https://opensky-network.org/api/states/all"
        # US Bounding Box: lamin=25.0, lomin=-130.0, lamax=50.0, lomax=-60.0
        self.params = {
            "lamin": 25.0,
            "lomin": -130.0,
            "lamax": 50.0,
            "lomax": -60.0
        }
        self.client = httpx.AsyncClient(timeout=10.0)

    async def fetch_live_states(self) -> List[TelemetryPayload]:
        """
        Fetches live ADS-B states from OpenSky Network.
        Indices:
        0: icao24
        5: longitude
        6: latitude
        7: baro_altitude
        9: velocity
        10: true_track
        """
        try:
            response = await self.client.get(self.url, params=self.params)
            response.raise_for_status()
            data = response.json()
            
            states = data.get("states")
            if not states:
                return []
                
            payloads = []
            for s in states:
                icao24 = s[0]
                lon = s[5]
                lat = s[6]
                alt = s[7]
                vel = s[9]
                heading = s[10]
                
                # Data Cleaning: Drop ghosts
                if lon is None or lat is None:
                    continue
                    
                # Simulated Phase 3c Metrics: Inject jitter in US Northeast
                jitter = 0.0
                nic = 10
                if 38 < lat < 45 and -78 < lon < -68:
                    import random
                    jitter = random.uniform(15.0, 30.0) # Trigger jamming threshold
                    nic = random.randint(1, 3)          # Trigger suspect status

                payloads.append(TelemetryPayload(
                    entity_id=icao24,
                    domain="aviation",
                    latitude=lat,
                    longitude=lon,
                    altitude=alt,
                    velocity=vel,
                    heading=heading,
                    jitter=jitter,
                    nic=nic
                ))
            return payloads
            
        except Exception as e:
            print(f"Error fetching from OpenSky: {e}")
            return []

    async def close(self):
        await self.client.aclose()

# Singleton instance for the ingestion pipeline
opensky_service = OpenSkyService()
