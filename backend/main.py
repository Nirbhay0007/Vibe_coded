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
from services.opensky_ingestion import opensky_service
from services.ais_ingestion import ais_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create the background task for broadcasting telemetry
    task = asyncio.create_task(broadcast_loop())
    yield
    # Shutdown: cancel task and close services
    task.cancel()
    await opensky_service.close()

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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the Time Machine history API (Lead Architect — Phase 2, Step 4)
app.include_router(history_router)

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
            
            # 1a. Fetch Live Aviation (10s interval to respect rate limits)
            if now - last_opensky_fetch >= 10.0:
                try:
                    aviation_cache = await opensky_service.fetch_live_states()
                    last_opensky_fetch = now
                    print(f"📡 [DATA LOGISTICS] Fetched {len(aviation_cache)} live flights from OpenSky.")
                except Exception as e:
                    print(f"⚠️ [DATA LOGISTICS] OpenSky Fetch Error: {e}")
            
            # 1b. Fetch Live Maritime (AIS Simulation — 1Hz)
            maritime_updates = [p.model_dump() for p in ais_service.get_vessel_states(dt=1.0)]
            
            # 1c. Combine datasets
            # Convert aviation Pydantic models to dicts
            updates = maritime_updates + [p.model_dump() for p in aviation_cache]
            current_timestamp = now
            
            # 2. Write to PostGIS database
            try:
                async with AsyncSessionLocal() as session:
                    for data in updates:
                        # Construct telemetry points
                        # Use func.ST_SetSRID(func.ST_MakePointM(lon, lat, timestamp), 4326)
                        point = func.ST_SetSRID(func.ST_MakePointM(data['longitude'], data['latitude'], current_timestamp), 4326)
                        telemetry_row = SensorTelemetry(
                            entity_id=data['entity_id'],
                            domain=data['domain'],
                            velocity=data.get('velocity'),
                            heading=data.get('heading'),
                            jitter=data.get('jitter', 0.0),
                            nic=data.get('nic', 10),
                            geometry=point
                        )
                        session.add(telemetry_row)
                    
                    # Commit the batch
                    await session.commit()
            except SQLAlchemyError as e:
                # print(f"Database error during telemetry insert: {e}")
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

