import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.osint_agent import osint_service
from ws_manager import manager

router = APIRouter()

class OsintSimulateRequest(BaseModel):
    raw_text: str

@router.post("/simulate")
async def simulate_osint_alert(request: OsintSimulateRequest):
    """
    Simulate an incoming OSINT report.
    Extracts location and alert details, then broadcasts to the frontend via WebSocket.
    """
    payload = osint_service.extract_intel(request.raw_text)
    if not payload:
        raise HTTPException(
            status_code=400, 
            detail="Could not extract valid latitude and longitude from raw_text. Please ensure 'Lat: <val>, Lon: <val>' format is used."
        )

    # Broadcast to websocket clients
    broadcast_msg = {
        "type": "osint_alert",
        "timestamp": time.time(),
        "data": payload.model_dump()
    }
    
    await manager.broadcast(broadcast_msg)
    
    return {"status": "success", "extracted_alert": payload.model_dump()}
