from pydantic import BaseModel, Field
from typing import Optional

class TelemetryPayload(BaseModel):
    """
    Standardized payload for all domain telemetry (aviation, maritime, etc.)
    """
    entity_id: str = Field(..., description="Unique identifier for the entity (e.g. ICAO24 hex)")
    domain: str = Field(..., description="Sensor domain: 'aviation' or 'maritime'")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude: Optional[float] = Field(None, description="Altitude in meters")
    velocity: Optional[float] = Field(None, description="Velocity in m/s")
    heading: Optional[float] = Field(None, description="True track in degrees (0-360)")
    jitter: Optional[float] = Field(0.0, description="Position jitter for jamming detection")
    nic: Optional[int] = Field(10, description="Navigation Integrity Category")
