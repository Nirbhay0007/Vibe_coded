'use client';

import { useTelemetryStore } from '@/store/telemetryStore';

export function EntityInspector() {
    const selectedId = useTelemetryStore((s) => s.selectedEntityId);
    const entity = useTelemetryStore((s) =>
        s.selectedEntityId ? s.entities[s.selectedEntityId] : null
    );

    // Hidden when nothing is selected (translated off-screen)
    const isVisible = selectedId !== null && entity !== null;

    return (
        <div
            className={`glass-panel bottom-20 left-4 w-[360px] p-4 z-40 transition-transform duration-300 ${isVisible ? 'translate-x-0' : '-translate-x-[120%]'
                }`}
        >
            {entity && (
                <>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-neon-cyan/30 pb-2 mb-3">
                        <h2 className="tactical-label text-neon-amber">
                            ENTITY INSPECTOR
                        </h2>
                        <span className="tactical-label text-neon-cyan">
                            {entity.domain.toUpperCase()}
                        </span>
                    </div>

                    {/* Identification Block */}
                    <div className="bg-[#020617]/50 p-2 border border-neon-teal/30 rounded-sm mb-3">
                        <span className="tactical-label block mb-1">
                            IDENTIFICATION
                        </span>
                        <div className="font-mono text-[11px] tabular-nums text-neon-cyan tracking-tight">
                            ID: {entity.entity_id}
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-slate-300 tracking-tight">
                            DOMAIN: {entity.domain.toUpperCase()}
                            {entity.dark_ship && (
                                <span className="ml-2 text-neon-fuchsia font-semibold animate-pulse">
                                    ⚠ DARK SHIP
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Spatial Data Block */}
                    <div className="bg-[#020617]/50 p-2 border border-neon-teal/30 rounded-sm">
                        <span className="tactical-label block mb-1">
                            SPATIAL DATA
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="tactical-label text-[8px]">LAT</span>
                                <div className="font-mono text-[11px] tabular-nums text-neon-cyan tracking-tight">
                                    {entity.latitude.toFixed(4)}°
                                </div>
                            </div>
                            <div>
                                <span className="tactical-label text-[8px]">LON</span>
                                <div className="font-mono text-[11px] tabular-nums text-neon-cyan tracking-tight">
                                    {entity.longitude.toFixed(4)}°
                                </div>
                            </div>
                            <div>
                                <span className="tactical-label text-[8px]">ALT</span>
                                <div className="font-mono text-[11px] tabular-nums text-neon-cyan tracking-tight">
                                    {entity.altitude.toFixed(0)} M
                                </div>
                            </div>
                            <div>
                                <span className="tactical-label text-[8px]">VEL</span>
                                <div className="font-mono text-[11px] tabular-nums text-neon-cyan tracking-tight">
                                    {entity.velocity.toFixed(1)} M/S
                                </div>
                            </div>
                            <div>
                                <span className="tactical-label text-[8px]">HDG</span>
                                <div className="font-mono text-[11px] tabular-nums text-neon-cyan tracking-tight">
                                    {entity.heading.toFixed(1)}°
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
