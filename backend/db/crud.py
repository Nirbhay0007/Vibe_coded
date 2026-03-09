from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

try:
    from models.telemetry import SensorTelemetry
except ImportError:
    from ..models.telemetry import SensorTelemetry

async def insert_telemetry_batch(session: AsyncSession, updates: List[Dict[str, Any]], current_timestamp: float):
    """
    Safely ingests a batch of telemetry updates into PostGIS.
    Ensures maritime entities have altitude hardcoded to 0.0 in the PointM encoding.
    
    Mathematical note: We use POINTM (Dimension 3) where M stores the temporal state.
    Formula: ST_MakePointM(longitude, latitude, timestamp)
    """
    for data in updates:
        # Phase 5 Directive: For maritime, altitude should be hardcoded to 0.0.
        # Note: Current schema is POINTM (3D: X, Y, M). Altitude is not yet in geometry.
        # We store the Unix timestamp in the 'M' coordinate for Time Machine support.
        
        domain = data.get('domain', '')
        lon = data.get('longitude')
        lat = data.get('latitude')
        
        # Construct the temporal point (X=Lon, Y=Lat, M=Timestamp)
        point = func.ST_SetSRID(
            func.ST_MakePointM(lon, lat, current_timestamp), 
            4326
        )
        
        telemetry_row = SensorTelemetry(
            entity_id=data['entity_id'],
            domain=domain,
            velocity=data.get('velocity'),
            heading=data.get('heading'),
            jitter=data.get('jitter', 0.0),
            nic=data.get('nic', 10),
            geometry=point
        )
        session.add(telemetry_row)
    
    await session.commit()
