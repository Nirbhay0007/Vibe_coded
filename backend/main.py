import asyncio
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from ws_manager import manager
from database import AsyncSessionLocal
from models.telemetry import SensorTelemetry
from routes.history import router as history_router
from routes.osint import router as osint_router
from routes.jamming import router as jamming_router
from services.mock_aviation import mock_aviation_service
from services.maritime_ingestion import maritime_service
from services.satellite_ingestion import satellite_service

def truncate_payload(d: dict) -> dict:
    """Level 1 Payload Optimization: truncate floats to reduce WebSocket bandwidth.
    Lat/Lon -> 5 decimal places (~1.1m precision, sufficient for visualization).
    Altitude/Velocity -> 1 decimal place.
    """
    if 'latitude' in d and d['latitude'] is not None:
        d['latitude'] = round(d['latitude'], 5)
    if 'longitude' in d and d['longitude'] is not None:
        d['longitude'] = round(d['longitude'], 5)
    if 'altitude' in d and d['altitude'] is not None:
        d['altitude'] = round(d['altitude'], 1)
    if 'velocity' in d and d['velocity'] is not None:
        d['velocity'] = round(d['velocity'], 1)
    return d

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create the background task for broadcasting telemetry
    task = asyncio.create_task(broadcast_loop())
    yield
    # Shutdown: cancel task and close services
    task.cancel()
    await mock_aviation_service.close()

# Initialize FastAPI for Phase 2: The Persistent Operational Picture
app = FastAPI(
    title="God's Eye Command Center API",
    description="Multi-Domain Sensor Fusion & 4D Telemetry Pipeline",
    version="0.2.0",
    lifespan=lifespan
)

# CORS configuration to allow local Next.js frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the Time Machine history API (Lead Architect — Phase 2, Step 4)
app.include_router(history_router)

# Mount the Agent 5 Intelligence Scraper API
app.include_router(osint_router, prefix="/api/osint", tags=["OSINT"])

# Mount the Phase 4/5 GPS Jamming Analytics API (One inclusion only)
app.include_router(jamming_router)

async def broadcast_loop():
    """
    Background task that continuously fetches live aviation data (OpenSky)
    and mock maritime data, writes to DB, and broadcasts at 1Hz.
    """
    aviation_cache = []
    last_opensky_fetch = 0
    
    while True:
        try:
            start_time = time.time()
            now = start_time
            
            # 1a. Fetch Mock Aviation (1Hz)
            try:
                aviation_cache = await mock_aviation_service.fetch_live_states(dt=1.0)
                print(f"📡 [DATA LOGISTICS] Fetched {len(aviation_cache)} simulated flights.")
            except Exception as e:
                print(f"⚠️ [DATA LOGISTICS] Mock Aviation Fetch Error: {e}")
            
            

            # 1c. Fetch Orbiting Satellites (SGP4 propagation — 1Hz)
            try:
                space_cache = await satellite_service.get_satellite_states(now)
                print(f"📡 [DATA LOGISTICS] Propagated {len(space_cache)} Strategic Assets.")
                # Ensure we skip extensive logging at 1Hz so we don't spam terminal
            except Exception as e:
                space_cache = []
                print(f"⚠️ [DATA LOGISTICS] SGP4 Math Error: {e}")

            # 1d. Fetch Live Maritime (Simulator — 1Hz)
            try:
                maritime_cache = maritime_service.step(dt=1.0)
                print(f"📡 [DATA LOGISTICS] Simulated {len(maritime_cache)} naval vessels.")
                maritime_updates = [truncate_payload(p.model_dump(exclude_none=True)) for p in maritime_cache]
            except Exception as e:
                print(f"⚠️ [DATA LOGISTICS] Maritime Simulator Error: {e}")
                maritime_updates = []
            
            # 1e. Combine datasets (strip null fields for payload compression)
            space_updates = [truncate_payload(p.model_dump(exclude_none=True)) for p in space_cache]
            aviation_updates = [truncate_payload(p.model_dump(exclude_none=True)) for p in aviation_cache]
            updates = [truncate_payload(p) for p in maritime_updates] + space_updates + aviation_updates
            current_timestamp = now
            
            # 2. Write to PostGIS database
            try:
                from db.crud import insert_telemetry_batch
                async with AsyncSessionLocal() as session:
                    await insert_telemetry_batch(session, updates, current_timestamp)
            except Exception as e:
                # High-level capture; production should use a structured logger
                pass
                
            # 3. Broadcast to all clients
            payload = {
                "type": "telemetry_update",
                "timestamp": current_timestamp,
                "data": updates
            }
            await manager.broadcast(payload)
            
            # Sleep to maintain 1Hz loop (1.0 - elapsed)
            elapsed = time.time() - start_time
            sleep_time = max(0.1, 1.0 - elapsed)
            await asyncio.sleep(sleep_time)
            
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in broadcast loop: {e}")
            await asyncio.sleep(1.0)


@app.get("/")
async def root():
    return {
        "system_status": "ONLINE",
        "engine": "FastAPI + PostGIS",
        "message": "Spatial DBA must initialize database schemas before telemetry ingestion."
    }

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We just keep connection open, optionally reading client messages
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

