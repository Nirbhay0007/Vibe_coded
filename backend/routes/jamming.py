"""
Jamming Heatmap API - Phase 5
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
import h3
import time
from typing import List

from database import get_db
from models.telemetry import SensorTelemetry
from models.schemas import HeatmapResponse, JammingCluster

router = APIRouter(prefix="/api/jamming", tags=["Jamming"])

def get_h3_index(lat: float, lon: float, res: int) -> str:
    try:
        # h3 >= 4.0
        return h3.latlng_to_cell(lat, lon, res)
    except AttributeError:
        # h3 < 4.0
        return h3.geo_to_h3(lat, lon, res)

def get_h3_center(h3_index: str):
    try:
        # h3 >= 4.0
        return h3.cell_to_latlng(h3_index)
    except AttributeError:
        # h3 < 4.0
        return h3.h3_to_geo(h3_index)

import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap(
    minutes_ago: int = Query(5, description="Time window for analyzing anomalies"),
    db: AsyncSession = Depends(get_db),
):
    logger.info("Heatmap endpoint hit by frontend")
    current_time = time.time()
    start_time = current_time - (minutes_ago * 60)
    
    query = (
        select(
            func.ST_X(SensorTelemetry.geometry).label("longitude"),
            func.ST_Y(SensorTelemetry.geometry).label("latitude"),
            SensorTelemetry.entity_id,
            SensorTelemetry.nic,
            SensorTelemetry.jitter,
        )
        .where(func.ST_M(SensorTelemetry.geometry) >= start_time)
        .where(
            or_(
                SensorTelemetry.nic < 5,
                SensorTelemetry.jitter > 0.5
            )
        )
    )
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    hexagons = {}
    for row in rows:
        # skip explicitly null rows if any
        if row.latitude is None or row.longitude is None:
            continue

        h3_idx = get_h3_index(row.latitude, row.longitude, 7)
        if h3_idx not in hexagons:
            hexagons[h3_idx] = {
                "entities": set(),
                "anomalies": 0
            }
        hexagons[h3_idx]["entities"].add(row.entity_id)
        hexagons[h3_idx]["anomalies"] += 1

    clusters = []
    
    for h3_index, data in hexagons.items():
        entity_count = len(data["entities"])
        # Simple anomaly score heuristic: normalized up to 10 anomalous reports
        anomaly_score = min(1.0, data["anomalies"] / 10.0)
        center_lat, center_lon = get_h3_center(h3_index)
        
        clusters.append(JammingCluster(
            h3_index=h3_index,
            anomaly_score=anomaly_score,
            entity_count=entity_count,
            center_lat=center_lat,
            center_lon=center_lon
        ))

    return HeatmapResponse(
        timestamp=current_time,
        resolution=7,
        clusters=clusters
    )
