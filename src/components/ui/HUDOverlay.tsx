'use client';
import { GlobalStatusPanel } from "./GlobalStatusPanel";
import { EntityInspector } from "./EntityInspector";
import { TimeMachineScrubber } from "./TimeMachineScrubber";
import { SensorToolbar } from "./SensorToolbar";

export function HUDOverlay() {
    return (
        <div className="absolute inset-0 z-40 pointer-events-none">
            <GlobalStatusPanel />
            <EntityInspector />
            <TimeMachineScrubber />
            <SensorToolbar />
        </div>
    );
}
