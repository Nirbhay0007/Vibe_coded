import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Fetch connection string from environment, fallback to defined Docker Compose string
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://admin:password@localhost:5432/gods_eye"
)

# Initialize the async SQLAlchemy Engine for high-throughput Postgres ingestion
engine = create_async_engine(
    DATABASE_URL,
    echo=False, # Set to False to stop console flooding
    future=True,
    pool_size=20, # Expand pool to allow heavy ingress of ADS-B data
    max_overflow=10
)

# Async Session Factory based on the engine
AsyncSessionLocal = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

async def get_db():
    """
    Dependency to yield an asynchronous database session.
    Automatically closes the session after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except SQLAlchemyError as e:
            # High-level capture, Data Logistics Agent should implement precise logging
            print(f"Database session error: {e}")
            raise
