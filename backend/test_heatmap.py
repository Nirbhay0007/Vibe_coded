import asyncio
from database import AsyncSessionLocal
from models.telemetry import SensorTelemetry
from sqlalchemy import select, or_, func
from geoalchemy2.functions import ST_X, ST_Y
import h3

async def check():
    async with AsyncSessionLocal() as session:
        stmt = select(
            ST_X(SensorTelemetry.geometry).label("lon"),
            ST_Y(SensorTelemetry.geometry).label("lat")
        ).where(
            or_(
                SensorTelemetry.nic < 5,
                SensorTelemetry.jitter > 0.5
            )
        )
        result = await session.execute(stmt)
        rows = result.fetchall()
        print(f"Total Anomalous Points Found: {len(rows)}")

        if rows:
            print("First anomalus row lat/lon:", rows[0].lat, rows[0].lon)
            h3_index = None
            if hasattr(h3, 'latlng_to_cell'):
                h3_index = h3.latlng_to_cell(rows[0].lat, rows[0].lon, 7)
            else:
                h3_index = h3.geo_to_h3(rows[0].lat, rows[0].lon, 7)
            print(f"Sample H3 resolution 7 index: {h3_index}")

if __name__ == "__main__":
    asyncio.run(check())
