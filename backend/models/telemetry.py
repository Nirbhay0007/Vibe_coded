from sqlalchemy import Column, String, Float, Integer
from sqlalchemy.orm import declarative_base
from geoalchemy2 import Geometry

Base = declarative_base()

class SensorTelemetry(Base):
    """
    SQLAlchemy model for the sensor_telemetry table.
    Ensures 4D "Time Machine" logic support utilizing PostGIS PointM coordinates.
    """
    __tablename__ = 'sensor_telemetry'

    # Using an auto-incrementing integer as primary key for SQLAlchemy requirements.
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    entity_id = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=False)  # e.g., 'aviation', 'maritime'
    velocity = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    
    # Store longitude, latitude and Unix timestamp together: ST_MakePointM(lon, lat, timestamp)
    geometry = Column(Geometry(geometry_type='POINTM', srid=4326), nullable=False)
