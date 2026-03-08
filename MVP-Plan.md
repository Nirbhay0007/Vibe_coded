# 🎨 UI/UX STANDARDS & THEME: 3D Geospatial Command Center
**Role:** Visual Design System & Frontend Constraints  
**Target Audience:** Rendering Specialist Agent & Lead Architect  

## 1. CORE DESIGN PHILOSOPHY
The application must look and function like a classified military-grade mission control software (e.g., Palantir Gotham, Anduril Lattice). 
- **Dark Mode Only:** The interface must be strictly dark mode to contrast against the glowing 3D globe and telemetry points.
- **Low Cognitive Load:** Adhere to MIL-STD-1472H human engineering standards. Do not clutter the center of the screen. 
- **Glassmorphism:** UI panels should float over the 3D map using semi-transparent, blurred backgrounds so the globe is never fully obscured.

## 2. COLOR PALETTE (Tailwind CSS Guide)
When generating UI components or Cesium primitives, strictly use these hex codes and Tailwind patterns:

**Base / Backgrounds (The Canvas):**
- `bg-slate-950` (`#020617`): Use for primary application background (behind the map).
- `bg-slate-900/80` with `backdrop-blur-md`: Use for floating side-panels and HUD overlays.
- Borders: `border-slate-800` to separate panel sections subtly.

**Tactical Accents (Neon System):**
- **Cyan (`#00E5FF`):** Use for Friendly/Neutral entities, primary active UI states, and default satellite tracks. Tailwind: `text-cyan-400`, `border-cyan-400`.
- **Magenta/Pink (`#FF00FF`):** Use for Anomalies, "Dark Ships", GPS Jamming zones, or hostile entities. Tailwind: `text-fuchsia-500`.
- **Amber (`#FFB300`):** Use for System Warnings, selected/highlighted entities, and pending actions. Tailwind: `text-amber-400`.

## 3. TYPOGRAPHY
- **Data & Telemetry:** MUST use a monospace font (e.g., `font-mono`, 'JetBrains Mono', or 'Fira Code') for all coordinates (Lat/Lon), timestamps, altitude, and velocity readouts. This ensures numbers align vertically in tables.
- **Headers & UI Labels:** Use a clean, modern sans-serif (e.g., `font-sans`, 'Inter', or 'Geist'). 
- **Text Sizing:** Keep labels small and uppercase (`text-xs uppercase tracking-widest text-slate-400`) to maximize the data-to-ink ratio.

## 4. UI LAYOUT & FITTS'S LAW
- **Fitts's Law Application:** Critical interactive elements (Time Slider, Layer Toggles, Zoom Controls) must be anchored to the absolute edges of the screen. 
- **The "HUD" Layout:**
  - **Top Left:** Global System Status & Active Target Metadata.
  - **Bottom Center:** The 4D Time Machine (Timeline scrubber).
  - **Right Edge:** Collapsible toolbars for Sensor Layers (Aviation, Maritime, Space).
- **No Intrusive Modals:** Never use center-screen popups. Information must slide in from the edges.

## 5. CESIUM 3D ENTITY SYMBOLOGY (MIL-STD-2525 Inspired)
When plotting `<Entity>` components in Resium, use the following visual rules:
- **Satellites:** Glowing Cyan dot. `<PointGraphics pixelSize={8} color={Cesium.Color.CYAN} />`. Leave a faint orbital trail (`<PathGraphics>`) fading to transparent.
- **Aircraft (ADS-B):** Use standard 3D GLTF models if available, or triangle SVG primitives pointing along their velocity vector. 
- **Selection State:** When an entity is clicked (`scene.pick`), wrap it in an Amber wireframe box or render a vertical line dropping from the entity down to the surface of the Earth.

## 6. AGENT DIRECTIVES FOR COMPONENT GENERATION
- Whenever you create a React component, ensure the outermost `div` uses `absolute`, `z-10`, and `pointer-events-auto` if it needs to overlay the Cesium `<Viewer />` (which should be `z-0`).
- Do not use bright white text (`text-white`). The maximum brightness for standard text should be `text-slate-200` to prevent eye strain.
- When generating buttons, always include a hover state that slightly illuminates the border (e.g., `hover:border-cyan-400/50 transition-colors`).