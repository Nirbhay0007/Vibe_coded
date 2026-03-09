import asyncio
import httpx
from typing import List, Optional
from models.schemas import TelemetryPayload

class OpenSkyService:
    def __init__(self):
        self.url = "https://opensky-network.org/api/states/all"
        # Small US Bounding Box (NYC Area) to limit data payload and rate limits for anonymous
        self.params = {
            "lamin": 40.0,
            "lomin": -75.0,
            "lamax": 42.0,
            "lomax": -71.0
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
            
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After", 30)
                print(f"CRITICAL: OpenSky Rate Limit Hit. Cooling down for {retry_after}s")
                await asyncio.sleep(int(retry_after))
                return []
                
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
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                print("CRITICAL: OpenSky Rate Limit Hit")
            else:
                print(f"Error fetching from OpenSky (HTTP {e.response.status_code}): {e}")
            return []
        except httpx.TimeoutException:
            print("CRITICAL: OpenSky Rate Limit Hit (Timeout)")
            return []
        except Exception as e:
            print(f"Error fetching from OpenSky: {e}")
            return []

    async def close(self):
        await self.client.aclose()

# Singleton instance for the ingestion pipeline
opensky_service = OpenSkyService()
