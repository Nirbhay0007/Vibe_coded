from pydantic import BaseModel, Field
from typing import Optional, Literal

class TelemetryPayload(BaseModel):
    """
    Standardized payload for all domain telemetry (aviation, maritime, etc.)
    """
    entity_id: str = Field(..., description="Unique identifier for the entity (e.g. ICAO24 hex or MMSI)")
    domain: Literal['aviation', 'maritime', 'space', 'osint_alert'] = Field(..., description="Sensor domain")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude: Optional[float] = Field(None, description="Altitude in meters")
    velocity: Optional[float] = Field(None, description="Velocity in m/s")
    heading: Optional[float] = Field(None, description="True track in degrees (0-360)")
    jitter: Optional[float] = Field(0.0, description="Position jitter for jamming detection")
    nic: Optional[int] = Field(10, description="Navigation Integrity Category")
    name: Optional[str] = Field(None, description="Human-readable name (e.g. satellite designation)")
    country: Optional[str] = Field(None, description="Country of origin / operator")

class AnomalyPayload(BaseModel):
    """
    Standardized payload for OSINT anomalies/alerts.
    """
    domain: str = Field(default="osint_alert", description="Domain of the alert")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    summary: str = Field(..., description="Brief summary of the alert")
    raw_text: Optional[str] = Field(None, description="Original raw text")

class JammingCluster(BaseModel):
    """
    Data for a single H3 hex bin containing anomalous entities.
    """
    h3_index: str = Field(..., description="The H3 hex cell string identifier")
    anomaly_score: float = Field(..., description="Normalized anomaly score between 0.0 and 1.0")
    entity_count: int = Field(..., description="Number of anomalous entities in this cell")
    center_lat: float = Field(..., description="Center latitude of the H3 cell")
    center_lon: float = Field(..., description="Center longitude of the H3 cell")

class HeatmapResponse(BaseModel):
    """
    Response schema for the H3 Jamming Heatmap API.
    """
    timestamp: float = Field(..., description="Unix timestamp of the response")
    resolution: int = Field(..., description="H3 resolution used for binning")
    clusters: list[JammingCluster] = Field(..., description="Array of anomaly clusters")
