from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI for Phase 2: The Persistent Operational Picture
app = FastAPI(
    title="God's Eye Command Center API",
    description="Multi-Domain Sensor Fusion & 4D Telemetry Pipeline",
    version="0.2.0"
)

# CORS configuration to allow local Next.js frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "system_status": "ONLINE",
        "engine": "FastAPI + PostGIS",
        "message": "Spatial DBA must initialize database schemas before telemetry ingestion."
    }

# Note to sub-agents: Database schemas (SQLAlchemy/GeoAlchemy2) and 
# WebSocket endpoints will be implemented by the Spatial DBA and Data Logistics Engineer.
