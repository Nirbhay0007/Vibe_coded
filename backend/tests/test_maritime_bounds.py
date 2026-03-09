# Mocking to allow test execution in bare environment
import sys
from unittest.mock import MagicMock

# Create a mock TelemetryPayload
class MockPayload:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

# Mock aiohttp and models before import
mock_aiohttp = MagicMock()
sys.modules["aiohttp"] = mock_aiohttp
mock_models = MagicMock()
mock_models.schemas.TelemetryPayload = MockPayload
sys.modules["models"] = mock_models
sys.modules["models.schemas"] = mock_models.schemas

import asyncio
import math
from backend.services.ais_ingestion import AISService

async def test_maritime_bounds():
    print("🚀 Starting Maritime Bounds Verification (Simulation Mode)...")
    
    # Corridor centers as defined in ais_ingestion.py
    CORRIDORS = {
        "Suez":      (30.1, 32.55),
        "Panama":    (9.1, -79.8),
        "Malacca":   (1.2, 103.5),
        "Gibraltar": (35.95, -5.5),
        "Hormuz":    (26.6, 56.45),
        "Mandeb":    (12.6, 43.45),
    }
    
    # Initialize service with fallback vessels
    service = AISService(fallback_count=120)
    
    # Verify each vessel is near its expected corridor 
    # Since we reduced offset to 0.15, they should all be within ~0.2 of SOME corridor center
    states = service.get_vessel_states(dt=1.0)
    
    for vessel in states:
        lat, lon = vessel.latitude, vessel.longitude
        found_near = False
        for c_lat, c_lon in CORRIDORS.values():
            # Tighter check: 0.2 degrees (0.15 random + small epsilon)
            if abs(lat - c_lat) <= 0.2 and abs(lon - c_lon) <= 0.2:
                found_near = True
                break
        
        if not found_near:
            print(f"❌ FAIL: Vessel {vessel.entity_id} at ({lat}, {lon}) is out of bounds! (Too far from water corridors)")
            return False
            
    print("✅ SUCCESS: All maritime entities remain within tight corridor bounds.")
    return True

if __name__ == "__main__":
    asyncio.run(test_maritime_bounds())
