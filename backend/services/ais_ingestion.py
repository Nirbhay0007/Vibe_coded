"""
Phase 5: Hybrid Live + Simulated AIS Ingestion Service.

Queries a live AIS JSON endpoint once per 60 seconds (strict rate limit),
caches the result, and serves it at 1Hz into the broadcast loop.
Falls back to the local corridor simulator if the live endpoint is unreachable.

Mathematical note (WGS84):
  1 degree of latitude  ≈ 111,139 meters
  1 degree of longitude ≈ 111,139 * cos(latitude) meters
"""

import asyncio
import math
import random
import time
from typing import List, Optional

import aiohttp

from models.schemas import TelemetryPayload

# ── Configuration ──────────────────────────────────────────────────────
AIS_ENDPOINT = "https://meri.digitraffic.fi/api/ais/v1/locations"
RATE_LIMIT_SECONDS = 60  # Strict: exactly once per minute
MAX_VESSELS_PER_FETCH = 300  # Cap to control payload size
COORD_PRECISION = 5  # Decimal places for lat/lon
FLOAT_PRECISION = 2  # Decimal places for velocity/heading


# ── Local Corridor Simulator (Fallback) ───────────────────────────────
class AISVessel:
    """Simulated vessel moving along a predefined shipping lane."""

    def __init__(self, mmsi: str, lat: float, lon: float,
                 velocity: float, heading: float):
        self.mmsi = mmsi
        self.latitude = lat
        self.longitude = lon
        self.velocity = velocity  # m/s
        self.heading = heading

    def step(self, dt: float = 1.0) -> None:
        """
        Advance the vessel position by dt seconds using flat-Earth approximation.
        Formula: Δlat = (v·cos(θ)·dt) / 111139
                 Δlon = (v·sin(θ)·dt) / (111139·cos(lat))
        """
        v_lat = self.velocity * math.cos(math.radians(self.heading))
        v_lon = self.velocity * math.sin(math.radians(self.heading))

        d_lat = (v_lat * dt) / 111139.0
        cos_lat = math.cos(math.radians(max(1.0, abs(self.latitude))))
        d_lon = (v_lon * dt) / (111139.0 * cos_lat)

        self.latitude += d_lat
        self.longitude += d_lon

        # Wrap longitude to [-180, 180]
        self.longitude = (self.longitude + 180) % 360 - 180

    def to_payload(self) -> TelemetryPayload:
        return TelemetryPayload(
            entity_id=self.mmsi,
            domain="maritime",
            latitude=round(self.latitude, COORD_PRECISION),
            longitude=round(self.longitude, COORD_PRECISION),
            altitude=0.0,
            velocity=round(self.velocity, FLOAT_PRECISION),
            heading=round(self.heading, FLOAT_PRECISION),
        )


# ── Hybrid AIS Service ────────────────────────────────────────────────
class AISService:
    """
    Hybrid AIS provider.
    - Queries live endpoint once per 60s, caches the result.
    - Between fetches (1Hz ticks), returns the cached live data.
    - Falls back to local simulator if endpoint unreachable.
    """

    def __init__(self, fallback_count: int = 220):
        # Live state
        self._session: Optional[aiohttp.ClientSession] = None
        self._last_fetch_time: float = 0.0
        self._live_cache: List[TelemetryPayload] = []
        self._live_available: bool = False

        # Fallback simulator
        self._fallback_vessels: List[AISVessel] = []
        self._init_fallback(fallback_count)

    # ── Fallback Initialization ───────────────────────────────────
    def _init_fallback(self, count: int) -> None:
        # Tighten offsets to ±0.15 degrees (approx 16km) to stay in mid-channel water.
        # Adjusted centers for better water-only spawning.
        corridors = [
            {"name": "Suez",      "lat": 30.1, "lon": 32.55, "heading": 160},
            {"name": "Panama",    "lat":  9.1, "lon": -79.8, "heading": 320},
            {"name": "Malacca",   "lat":  1.2, "lon": 103.5, "heading": 305},
            {"name": "Gibraltar", "lat": 35.95, "lon": -5.5,  "heading": 270},
            {"name": "Hormuz",    "lat": 26.6, "lon": 56.45, "heading": 240},
            {"name": "Mandeb",    "lat": 12.6, "lon": 43.45, "heading": 322},
        ]
        per_corridor = count // len(corridors)

        for corridor in corridors:
            for _ in range(per_corridor):
                mmsi = f"{random.randint(200000000, 775999999)}"
                self._fallback_vessels.append(AISVessel(
                    mmsi=mmsi,
                    lat=float(corridor["lat"]) + random.uniform(-0.15, 0.15),
                    lon=float(corridor["lon"]) + random.uniform(-0.15, 0.15),
                    velocity=random.uniform(5.0, 12.0),
                    heading=float(corridor["heading"]) + random.uniform(-5, 5),
                ))

    # ── HTTP Session (lazy init) ──────────────────────────────────
    async def _ensure_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=15)
            )
        return self._session

    # ── Live Fetch with Rate Limit ────────────────────────────────
    async def _fetch_live(self) -> List[TelemetryPayload]:
        """
        Query the live AIS endpoint. Enforces a strict 60-second rate limit.
        Returns parsed TelemetryPayload list, or empty list on failure.
        """
        now = time.monotonic()
        if (now - self._last_fetch_time) < RATE_LIMIT_SECONDS:
            return self._live_cache  # Return cached data between fetches

        self._last_fetch_time = now
        session = await self._ensure_session()

        try:
            async with session.get(AIS_ENDPOINT) as resp:
                if resp.status != 200:
                    print(f"⚠️ [AIS] Live endpoint returned HTTP {resp.status}")
                    return []

                data = await resp.json()

                # Digitraffic returns {"type": "FeatureCollection", "features": [...]}
                features = data.get("features", [])
                payloads: List[TelemetryPayload] = []

                for feature in features[:MAX_VESSELS_PER_FETCH]:
                    props = feature.get("properties", {})
                    geom = feature.get("geometry", {})
                    coords = geom.get("coordinates", [])

                    if len(coords) < 2:
                        continue

                    lon = coords[0]
                    lat = coords[1]
                    mmsi = str(props.get("mmsi", ""))
                    sog = props.get("sog", 0.0)  # Speed Over Ground (knots)
                    cog = props.get("cog", 0.0)  # Course Over Ground (degrees)

                    if not mmsi or lat is None or lon is None:
                        continue

                    # Convert SOG from 1/10 knots to m/s: (sog / 10) * 0.514444
                    velocity_ms = round((sog / 10.0) * 0.514444, FLOAT_PRECISION)
                    heading_deg = round((cog / 10.0) % 360.0, FLOAT_PRECISION)

                    payloads.append(TelemetryPayload(
                        entity_id=mmsi,
                        domain="maritime",
                        latitude=round(lat, COORD_PRECISION),
                        longitude=round(lon, COORD_PRECISION),
                        altitude=0.0,
                        velocity=velocity_ms,
                        heading=heading_deg,
                    ))

                print(f"📡 [AIS] Fetched {len(payloads)} live vessels from endpoint.")
                self._live_cache = payloads
                self._live_available = True
                return payloads

        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            print(f"⚠️ [AIS] Live endpoint unreachable: {e}. Using fallback.")
            self._live_available = False
            return []

    # ── Public Interface (called at 1Hz by broadcast_loop) ────────
    async def fetch_live_states(self, dt: float = 1.0) -> List[TelemetryPayload]:
        """
        Returns the current AIS state vector at 1Hz.
        Tries live first; falls back to simulator if live is unavailable.
        """
        live_data = await self._fetch_live()

        if live_data:
            return live_data

        # Fallback: step the simulator and return
        payloads: List[TelemetryPayload] = []
        for vessel in self._fallback_vessels:
            vessel.step(dt)
            payloads.append(vessel.to_payload())
        return payloads

    # ── Legacy sync interface (keeping backward compatibility) ────
    def get_vessel_states(self, dt: float = 1.0) -> List[TelemetryPayload]:
        """
        Synchronous fallback for any remaining sync call sites.
        Steps the simulator and returns payloads.
        """
        payloads: List[TelemetryPayload] = []
        for vessel in self._fallback_vessels:
            vessel.step(dt)
            payloads.append(vessel.to_payload())
        return payloads

    # ── Cleanup ───────────────────────────────────────────────────
    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()


# Singleton instance
ais_service = AISService()
