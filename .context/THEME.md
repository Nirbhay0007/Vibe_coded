Here is the highly expanded, **depth-rich context document** designed to be fed directly into your Agentic AI (like Cursor, Windsurf, or Antigravity IDE).

This document synthesizes your visual identity, UI/UX standards, and 3D rendering rules into a granular, machine-readable format. It gives the AI exact instructions on *how* to implement the "vibe," translating abstract design concepts into precise Tailwind utility classes, CSS animations, and CesiumJS/Resium component structures.

---

# 🎨 THEME.md: Advanced Visual Architecture & UI/UX Directives

**Role:** Master Design System & Component Generation Protocol
**Target Agent:** Rendering Specialist & Frontend Architect

## 1. THE GLASSMORPHIC COMMAND CANVAS (Base Atmosphere)

The application must feel like a holographic projection layered over a deep, dark physical world. We do not use solid, opaque backgrounds for the UI; everything must maintain a connection to the 3D map beneath it.

* **The Z-Index Stratigraphy:**
* `z-0`: Cesium `<Viewer />` (The World).
* `z-10`: Data Polygons, H3 Hexagons, and Ground Primitives.
* `z-20`: 3D Entities (Satellites, Aircraft, Ships).
* `z-40`: The "Glass" HUD Overlays (Sidebars, Topbars).
* `z-50`: Critical Alerts & Modal Slide-ins.


* **Panel Material Specification:**
* Whenever an agent creates a UI panel (sidebar, widget, data card), it MUST use this exact Tailwind string:
`absolute bg-slate-950/80 backdrop-blur-md border border-teal-900/50 shadow-[0_0_15px_rgba(0,229,255,0.1)] text-slate-200 pointer-events-auto`



## 2. THE TACTICAL NEON PALETTE (Strict Hex/Tailwind Mapping)

Agents must not invent colors. Use these exact hex codes mapped to Tailwind arbitrary values or standard classes.

| Concept | Hex Code | Tailwind Implementation | Usage Context |
| --- | --- | --- | --- |
| **Canvas Black** | `#020617` | `bg-[#020617]` or `bg-slate-950` | Base behind the map, deep shadows. |
| **Panel Glass** | `#0D0D0D` | `bg-[#0D0D0D]/85` | Primary HUD panel backgrounds. |
| **Neon Cyan** | `#00E5FF` | `text-[#00E5FF]`, `border-[#00E5FF]` | Friendly entities, active tabs, satellite trails, primary data highlights. |
| **Deep Teal** | `#008080` | `border-[#008080]`, `text-[#008080]` | Inactive panel borders, grid lines, structural UI dividers. |
| **Pulse Red** | `#FF3131` | `text-[#FF3131]`, `bg-[#FF3131]/20` | High-threat alerts, GPS Jamming H3 heatmaps, hostile entity markers. |
| **Fuchsia** | `#FF00FF` | `text-[#FF00FF]`, `shadow-[#FF00FF]` | Dark Ships, spoofed coordinates, AI anomaly detections. |
| **Amber** | `#FFB300` | `text-[#FFB300]`, `border-[#FFB300]` | Currently selected entity (clicked), warnings, historical time-scrubber handle. |

## 3. TYPOGRAPHIC ENGINEERING (Data-to-Ink Maximization)

Text in a command center is not meant to be read like a book; it is meant to be scanned rapidly.

* **Telemetry Data (Coordinates, Speed, Altitude, Time):**
* **Rule:** MUST use `font-mono` and `tabular-nums`.
* *Why:* `tabular-nums` ensures that rapidly changing numbers (like a live altitude readout) do not cause the UI width to jitter.
* *Example Tailwind:* `font-mono text-[11px] tabular-nums text-cyan-400 tracking-tight`.


* **Headers & Labels (Titles, Field Names):**
* **Rule:** Small, muted, heavily tracked uppercase.
* *Example Tailwind:* `font-sans text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold`.



## 4. SPATIAL POSITIONING (Fitts's Law Execution)

The center of the screen must remain 100% clear for the 3D Cesium globe. All UI elements must be anchored to the absolute edges of the viewport.

* **[Top-Left] Global Heartbeat:** Fixed at `top-4 left-4`. Displays overarching system status (e.g., "SGP4 ENGINE: ONLINE", "API LIMIT: 94%").
* **[Bottom-Left] Entity Inspector:** Fixed at `bottom-20 left-4`. When an entity is clicked, this panel slides in (`translate-x-0` from `-translate-x-full`) displaying MMSI, ICAO, Lat/Lon, and operator details.
* **[Right Edge] The Sensor Stack:** Fixed at `top-4 right-4 bottom-20`. A vertical toolbar of collapsible accordion menus. Toggles for ADS-B, AIS, Space-Track, and OSINT Layers.
* **[Bottom Edge] The Time Machine:** Fixed at `bottom-0 left-0 right-0 h-16`. A full-width, horizontal scrubber bar. The timeline itself is Deep Teal; the current time handle is glowing Amber.

## 5. CESIUM 3D RENDERING & MIL-STD-2525 SYMBOLOGY

When the agent writes `<Entity>` components in `resium`, it must translate the visual rules into WebGL/WebGPU properties.

* **Friendly Satellites (Cyan Glow):**
```javascript
<PointGraphics pixelSize={6} color={Cesium.Color.fromCssColorString('#00E5FF')} 
               outlineColor={Cesium.Color.fromCssColorString('#00E5FF').withAlpha(0.3)} outlineWidth={4} />
<PathGraphics material={Cesium.Color.fromCssColorString('#00E5FF').withAlpha(0.5)} width={1} leadTime={0} trailTime={3600} />

```


* **Selection State (The "Drop Line"):** When an entity is selected via `scene.pick`, render a vertical line from the entity's altitude down to the Earth's surface to aid spatial comprehension.
```javascript
<PolylineGraphics positions={[entityPosition, groundPosition]} 
                  material={new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#FFB300') })} width={2} />

```


* **Hostile/Anomaly Symbology:**
If a ship is flagged as "Dark" (AIS turned off), render it as a Fuchsia `#FF00FF` point with a blinking/pulsing scale.

## 6. ANIMATION & HOLOGRAPHIC SHADERS (CSS Protocol)

Command centers feel "alive" through subtle animations. Agents must implement these custom Tailwind `@keyframes` in `globals.css`:

* **The OSINT "Ping":** When the AI agent extracts a coordinate from Telegram/X, drop a ping on the map.
* *Implementation:* A circular div overlaid using Cesium's `Scene.cartesianToCanvasCoordinates`.
* *Animation:* `animate-ping` but colored `#00E5FF` with an expanding `box-shadow`.


* **Jamming Heatmaps (The Breathe Effect):** Uber H3 Hexagons representing GPS jamming must pulse to indicate active interference.
* *Implementation:* `<PolygonGraphics>` in Cesium.
* *Animation Protocol:* Bind the `material` property to a `Cesium.CallbackProperty` that returns `Cesium.Color.fromCssColorString('#FF3131').withAlpha(opacity)` where `opacity` is calculated using `Math.sin(Date.now() / 1000) * 0.2 + 0.4` (cycles smoothly between 0.2 and 0.6).


* **UI Hover States:** All interactive buttons must have a micro-interaction.
* *Tailwind:* `transition-all duration-300 hover:border-[#00E5FF] hover:bg-[#00E5FF]/10 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)]`



## 7. STRICT ENFORCEMENT DIRECTIVES FOR AI AGENTS

1. **NO WHITE TEXT:** Never use `text-white`. The absolute brightest allowed text is `text-slate-200`.
2. **NO ROUNDED CORNERS:** This is military software, not a consumer social media app. Use sharp corners `rounded-none` or at maximum `rounded-sm` (2px) for inner data blocks.
3. **CSS OVER JAVASCRIPT:** Whenever possible, achieve glow effects, blurs, and hover states using pure CSS/Tailwind rather than heavy JavaScript calculations, to save CPU threads for the SGP4 math and Cesium rendering engine.
4. **RESPECT THE GLOBE:** Never create a UI component with a solid background that obscures more than 25% of the 3D globe. Transparency is mandatory.