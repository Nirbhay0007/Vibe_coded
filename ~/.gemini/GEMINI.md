# Global Agentic Rules: 3D Command Center Protocol (2026)

## 1. Architectural Integrity
- **Veto Condition:** Immediately reject any proposal to use legacy WebGL. 
- **Standard:** All rendering logic must target the **WebGPU** backend via CesiumJS.
- **File Limit:** Strictly maintain a "500-Line Limit." If a file exceeds 500 lines, the agent must propose a refactor to split logic into modular components (e.g., `Viewer.tsx`, `TelemetryLayer.ts`).

## 2. Geospatial Rigor
- **Coordinate System:** Strictly enforce **WGS84 (EPSG:4326)** for all ingestion and **ECEF (Earth-Centered, Earth-Fixed)** for internal physics/collision calculations.
- **Math Safety:** Explicitly convert all radians to degrees (or vice versa) before passing values to the Cesium API. 
- **Time-Dynamic Data:** Use **CZML (Cesium Markup Language)** for all time-varying entity packets to ensure "Time Machine" compatibility.

## 3. UI/UX "Vibe" Standards
- **Theme:** Enforce a "Tactical Neon" dark mode. Use Cyan (#00FFFF) for friendly assets, Teal (#008080) for neutral, and Neon-Red (#FF3131) for EW/Jamming alerts.
- **Symbology:** All 2D icons must conform to **MIL-STD-2525** vector standards.
- **Performance:** For Google Photorealistic 3D Tiles, always set `Cesium.RequestScheduler.maximumRequestsPerServer = 18` to optimize throughput.

## 4. Code Hygiene & Agent Behavior
- **TypeScript:** Use "Strict Mode" always. No `any` types allowed for spatial coordinate objects.
- **Documentation:** Every function that performs a coordinate transformation (e.g., LLA to ECEF) must include a JSDoc block citing the mathematical formula used.
- **Asynchronous Execution:** When spawning parallel agents, use the "Task List" artifact to announce dependencies (e.g., "Agent B: Waiting for Database Schema from Agent A").