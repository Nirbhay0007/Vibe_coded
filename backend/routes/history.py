"""
Time Machine History API — Lead Architect (Agent 1)
Queries the PostGIS sensor_telemetry table for 4D trajectory playback.

Uses ST_M() to extract the Unix timestamp embedded in PointM geometries,
and ST_X()/ST_Y() for longitude/latitude extraction (WGS84).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from database import get_db
from models.telemetry import SensorTelemetry

router = APIRouter(prefix="/api/history", tags=["Time Machine"])


@router.get("/trajectory")
async def get_trajectory(
    entity_id: str = Query(..., description="Entity ID to retrieve trajectory for"),
    start_time: float = Query(..., description="Unix timestamp — start of time window"),
    end_time: float = Query(..., description="Unix timestamp — end of time window"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves the full 4D trajectory of a single entity within a time window.

    Math note: The M-coordinate in our PointM geometry stores the Unix timestamp.
    We extract it via ST_M(geometry) and filter the range server-side for efficiency.

    Returns positions ordered chronologically for smooth playback interpolation.
    """
    query = (
        select(
            SensorTelemetry.entity_id,
            SensorTelemetry.domain,
            SensorTelemetry.velocity,
            SensorTelemetry.heading,
            func.ST_X(SensorTelemetry.geometry).label("longitude"),
            func.ST_Y(SensorTelemetry.geometry).label("latitude"),
            func.ST_M(SensorTelemetry.geometry).label("timestamp"),
        )
        .where(SensorTelemetry.entity_id == entity_id)
        .where(func.ST_M(SensorTelemetry.geometry) >= start_time)
        .where(func.ST_M(SensorTelemetry.geometry) <= end_time)
        .order_by(func.ST_M(SensorTelemetry.geometry).asc())
    )

    result = await db.execute(query)
    rows = result.all()

    trajectory = [
        {
            "entity_id": row.entity_id,
            "domain": row.domain,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "altitude": 0.0,  # PointM stores M as timestamp, altitude from domain defaults
            "velocity": row.velocity,
            "heading": row.heading,
            "timestamp": row.timestamp,
        }
        for row in rows
    ]

    return {"entity_id": entity_id, "points": len(trajectory), "trajectory": trajectory}


@router.get("/snapshot")
async def get_snapshot(
    timestamp: float = Query(..., description="Target Unix timestamp to reconstruct"),
    domain: Optional[str] = Query(None, description="Filter by domain: aviation, maritime, space"),
    db: AsyncSession = Depends(get_db),
):
    """
    Reconstructs the operational picture at a specific moment in time.

    Finds the LATEST recorded position for each entity that existed
    at or before the requested timestamp. This gives us the most recent
    known position of every entity — exactly what the Time Machine slider needs.
    """
    # Use a window function to get the latest row per entity at or before target time
    subquery = (
        select(
            SensorTelemetry.entity_id,
            SensorTelemetry.domain,
            SensorTelemetry.velocity,
            SensorTelemetry.heading,
            func.ST_X(SensorTelemetry.geometry).label("longitude"),
            func.ST_Y(SensorTelemetry.geometry).label("latitude"),
            func.ST_M(SensorTelemetry.geometry).label("timestamp"),
            func.row_number()
            .over(
                partition_by=SensorTelemetry.entity_id,
                order_by=func.ST_M(SensorTelemetry.geometry).desc(),
            )
            .label("rn"),
        )
        .where(func.ST_M(SensorTelemetry.geometry) <= timestamp)
    )

    if domain:
        subquery = subquery.where(SensorTelemetry.domain == domain)

    subquery = subquery.subquery()

    query = select(subquery).where(subquery.c.rn == 1)

    result = await db.execute(query)
    rows = result.all()

    entities = [
        {
            "entity_id": row.entity_id,
            "domain": row.domain,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "altitude": 0.0,
            "velocity": row.velocity,
            "heading": row.heading,
            "timestamp": row.timestamp,
        }
        for row in rows
    ]

    return {
        "requested_timestamp": timestamp,
        "entities_found": len(entities),
        "data": entities,
    }


@router.get("/timerange")
async def get_time_range(db: AsyncSession = Depends(get_db)):
    """
    Returns the min and max timestamps stored in PostGIS.
    The frontend Time Machine slider uses this to set its bounds.
    """
    query = select(
        func.min(func.ST_M(SensorTelemetry.geometry)).label("earliest"),
        func.max(func.ST_M(SensorTelemetry.geometry)).label("latest"),
    )

    result = await db.execute(query)
    row = result.one_or_none()

    if row and row.earliest is not None:
        return {
            "earliest": row.earliest,
            "latest": row.latest,
            "duration_seconds": row.latest - row.earliest,
        }

    return {"earliest": None, "latest": None, "duration_seconds": 0}
