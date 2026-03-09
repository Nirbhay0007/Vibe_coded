import re
from typing import Optional
from models.schemas import AnomalyPayload

class IntelligenceScraper:
    def __init__(self):
        # Basic regex to find Lat/Lat: and Lon/Lon: patterns
        self.lat_regex = re.compile(r'Lat(?:itude)?:\s*(-?\d+(?:\.\d+)?)', re.IGNORECASE)
        self.lon_regex = re.compile(r'Lon(?:gitude)?:\s*(-?\d+(?:\.\d+)?)', re.IGNORECASE)

    def extract_intel(self, raw_text: str) -> Optional[AnomalyPayload]:
        """
        Extracts latitude, longitude, and summary from raw OSINT text.
        """
        lat_match = self.lat_regex.search(raw_text)
        lon_match = self.lon_regex.search(raw_text)

        if not lat_match or not lon_match:
            return None

        lat = float(lat_match.group(1))
        lon = float(lon_match.group(1))

        # Basic summary extraction: clean up the Lat/Lon part
        summary = self.lat_regex.sub('', raw_text)
        summary = self.lon_regex.sub('', summary)
        # Clean up common artifacts from the simple sentence
        summary = summary.replace('near', '').replace(',', ' ').strip()
        # Remove multiple spaces
        summary = re.sub(r'\s+', ' ', summary)

        if not summary:
            summary = "Anomaly detected at specified coordinates."
            
        return AnomalyPayload(
            domain="osint_alert",
            latitude=lat,
            longitude=lon,
            summary=summary,
            raw_text=raw_text
        )

osint_service = IntelligenceScraper()
