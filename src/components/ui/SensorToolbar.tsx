import React from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';

export function SensorToolbar() {
    const { 
        showJammingLayer, 
        toggleJammingLayer, 
        jammingOpacity, 
        setJammingOpacity,
        jammingTimeWindow,
        setJammingTimeWindow
    } = useTelemetryStore();

    return (
        <div className="glass-panel top-4 right-4 bottom-20 w-[280px] flex flex-col p-2 space-y-2 overflow-y-auto">
            <div className="pb-2 border-b border-[#008080]/50 text-center">
                <h3 className="tactical-label">SENSOR STACK</h3>
            </div>

            <button className="interactive-btn flex justify-between items-center p-2 border border-[#008080]/30 flex-1 max-h-12">
                <span className="tactical-label">ADS-B (AIR)</span>
                <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-glow-cyan"></div>
            </button>

            <button className="interactive-btn flex justify-between items-center p-2 border border-[#008080]/30 flex-1 max-h-12">
                <span className="tactical-label">AIS (SEA)</span>
                <div className="w-2 h-2 rounded-full bg-neon-teal"></div>
            </button>

            <button className="interactive-btn flex justify-between items-center p-2 border border-[#008080]/30 flex-1 max-h-12 shrink-0">
                <span className="tactical-label">SPACE-TRACK</span>
                <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-glow-cyan animate-pulse"></div>
            </button>

            {/* Phase 5: GPS Jamming Controls */}
            <div className="mt-4 p-2 border border-neon-red/30 bg-black/40 rounded-sm space-y-4">
                <button 
                    className={`interactive-btn flex justify-between items-center p-2 w-full border ${showJammingLayer ? 'border-neon-red/50 bg-neon-red/10 shadow-[0_0_10px_rgba(255,49,49,0.2)]' : 'border-slate-800 bg-transparent'}`}
                    onClick={toggleJammingLayer}
                >
                    <span className={`tactical-label ${showJammingLayer ? 'text-neon-red' : 'text-slate-500'}`}>EW/JAMMING (H3)</span>
                    <div className={`w-2 h-2 rounded-full ${showJammingLayer ? 'bg-neon-red shadow-[0_0_8px_rgba(255,49,49,0.8)]' : 'bg-slate-700'}`}></div>
                </button>

                {showJammingLayer && (
                    <div className="space-y-3 px-1">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase text-slate-400 font-mono tracking-wider">Opacity</span>
                                <span className="text-[10px] text-neon-red font-mono tabular-nums">{(jammingOpacity * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.1" 
                                value={jammingOpacity}
                                onChange={(e) => setJammingOpacity(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-red"
                            />
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase text-slate-400 font-mono tracking-wider">Time Window</span>
                                <span className="text-[10px] text-neon-red font-mono tabular-nums">{jammingTimeWindow}m</span>
                            </div>
                            <input 
                                type="range" 
                                min="5" 
                                max="1440" 
                                step="15" 
                                value={jammingTimeWindow}
                                onChange={(e) => setJammingTimeWindow(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-red"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
