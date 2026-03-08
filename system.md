# GLOBAL PROJECT TRUTH: 3D Geospatial Command Center ("God's Eye")
**Role:** Master System Prompt & Architectural Source of Truth  
**Target Audience:** Lead Architect Agent & All Sub-Agents  

## 1. MISSION STATEMENT
We are building a military-grade, real-time 3D Geospatial Command Center (a "Spy Satellite Simulator"). This is a persistent, high-fidelity digital twin of physical reality capable of multi-domain sensor fusion (Orbital, Aviation, Maritime). Performance, mathematical accuracy, and strict adherence to the defined architecture are non-negotiable.

## 2. THE TECHNOLOGY STACK
You must strictly adhere to the following stack and versions. Do not suggest or implement alternatives (e.g., do not use Leaflet, Three.js, or plain Express).

**Frontend (The Digital Canvas):**
- **Framework:** Next.js 14+ (Strictly App Router) & React 18+.
- **3D Engine:** CesiumJS (latest version) with WebGPU rendering enabled.
- **React Wrapper:** `resium` (Strictly use this for mapping React state to Cesium).
- **Styling:** Tailwind CSS (Dark tactical theme, high contrast).
- **Language:** TypeScript (v5.3+). Strict type-checking enabled. `any` types are forbidden for geospatial data.

**Backend & Data Fusion:**
- **Framework:** Python 3.12+ with FastAPI (Async/Await strict).
- **Orbital Math:** `satellite.js` (Frontend) or `sgp4` (Backend Python).
- **Database:** PostgreSQL 16+ with PostGIS 3.4+ extension.
- **ORM:** SQLAlchemy 2.0 with GeoAlchemy2.
- **Indexing:** Uber `H3` or Google `S2` Geometry.

## 3. GLOBAL ARCHITECTURAL CONSTRAINTS
All agents must adhere to the following hard rules. If a requested change violates these rules, the agent must veto the action and warn the user.

1. **File Size Limit:** No single file may exceed 500 lines of code. If a file approaches this limit, refactor and abstract logic into smaller modules or hooks.
2. **Coordinate Standard:** All geospatial data must be standardized to the **WGS84** reference ellipsoid. 
3. **Server vs. Client Components:** In Next.js, the Cesium/Resium 3D viewer and any orbital math logic must be wrapped in `'use client'` directives. 
4. **Memory Management:** Cesium creates heavy WebGL/WebGPU contexts. Ensure rigorous garbage collection. Never instantiate multiple `<Viewer />` components. Use React `useEffect` cleanup functions to destroy entities and primitives when unmounted.
5. **UI Cognitive Load:** The UI must follow MIL-STD-1472H guidelines. Low cognitive load, dark mode by default, utilizing Fitts's Law for interaction targets.

## 4. MATHEMATICS & PHYSICS PROTOCOL
Agent hallucinations regarding orbital math will break the application. Follow these rules exactly:

- **SGP4 Propagation:** When calculating satellite trajectories using Two-Line Elements (TLEs), you must propagate to Earth-Centered Inertial (ECI) coordinates first.
- **Coordinate Conversion:** You must accurately convert ECI to Earth-Centered, Earth-Fixed (ECEF), and then to Geodetic (Latitude, Longitude, Altitude).
- **THE RADIAN RULE:** `satellite.js` outputs mathematical results in **radians**. CesiumJS entities often require **degrees** (via `Cesium.Cartesian3.fromDegrees`). **You must explicitly convert radians to degrees before passing data to the frontend rendering engine.**

## 5. AGENT SWARM DIRECTIVES & CONTEXT PARTITIONING
As an agent operating in this workspace, you are part of a swarm. You must respect the context boundaries:

- **Do not guess API syntax:** If writing Cesium or Resium code, refer to official documentation or crawl `https://resium.reearth.io/`. 
- **Check `.context/` first:** - For UI/UX or styling, read `.context/THEME.md`.
  - For spatial database queries, read `.context/database.md`.
  - For ADSB/AIS decoding, read `.context/api-specs.md`.
- **MVP Focus:** Do not implement features outside the scope of the current active step in `MVP-Plan.md` unless explicitly instructed by the human operator.

## 6. DEBUGGING PROTOCOL
If an error occurs during execution:
1. **Math Errors (Satellites inside the Earth/Wrong Location):** Check the Radian-to-Degree conversion pipeline immediately.
2. **Resium Errors (Component not mounting):** Verify you are not mixing vanilla Cesium imperative code (`viewer.entities.add()`) with Resium declarative components (`<Entity />`). Choose the declarative Resium approach.
3. **Memory Leaks (Browser crash):** Check for runaway `setInterval` or `requestAnimationFrame` loops bypassing the Cesium Clock tick. Use Cesium's native `onTick` event listener for telemetry updates.