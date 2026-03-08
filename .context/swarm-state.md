# 🤖 SWARM STATE & DIRECTORY LOG
**Role:** Live Registry of Active Agents, Status, and Territory Boundaries
**Current Project Phase:** Phase 2, Step 3 (Global State & Entity Inspector)

## 1. THE NAME TAG RULE
To prevent communication overlap, every AI agent MUST prefix their responses to the human operator with their designated emoji and title (e.g., "**🎨 [RENDERING SPECIALIST]:** I have updated the UI.").

## 2. AGENT ROSTER & CURRENT STATUS

### 🏛️ AGENT 1: LEAD ARCHITECT
* **Status:** STANDBY (Monitoring Phase 2 execution).
* **Role:** Oversees global architecture, Next.js API routes (`/src/app/api`), and Docker (`/backend/docker-compose.yml`).
* **Territory:** `/src/app/api/`, `/backend` (infrastructure).
* **Constraint:** Does not touch frontend UI components or database schemas.

### 🎨 AGENT 2: RENDERING SPECIALIST
* **Status:** ACTIVE (Currently building Zustand store and Entity Inspector).
* **Role:** Manages the Next.js frontend, CesiumJS WebGPU rendering, and Tailwind CSS implementation. 
* **Territory:** `/src/components/`, `/src/store/`, `/src/app/globals.css`.
* **Constraint:** Must strictly follow `.context/THEME.md`. Never use standard React `useState` for high-frequency 3D coordinates.

### 🗄️ AGENT 3: SPATIAL DBA
* **Status:** STANDBY (Schema initialized).
* **Role:** Manages the PostgreSQL / PostGIS database.
* **Territory:** `/backend/db/`.
* **Constraint:** All spatial coordinates must use `ST_MakePointM` and adhere to the WGS84 standard (SRID 4326).

### 📡 AGENT 4: DATA LOGISTICS ENGINEER
* **Status:** STANDBY (WebSocket pipeline successfully established).
* **Role:** Builds Python ingestion scripts, connects to OpenSky (ADS-B) and AIS hubs, and broadcasts via FastAPI WebSockets.
* **Territory:** `/backend/services/`, `/backend/main.py`.
* **Constraint:** Must validate all incoming data using strict Pydantic models before pushing to the WebSocket or Database.

### 🧠 AGENT 5: INTELLIGENCE SCRAPER
* **Status:** OFFLINE (Not yet initialized).
* **Role:** LangChain/Agentic AI for OSINT scraping (Telegram, X/Twitter).
* **Territory:** `/backend/agents/`.

## 3. SWARM COLLABORATION PROTOCOL
1. **Never cross territories.** If the Rendering Specialist needs a new API endpoint, it must ask the human to deploy the Lead Architect. It cannot write the backend code itself.
2. **Check the Inbox.** Agents should push major changes to the IDE's review tab/inbox rather than force-saving directly to main files while other agents are working.
3. **Read the state.** Before writing code, agents should check this file to ensure they are not stepping on an "ACTIVE" agent's current task.