export function SensorToolbar() {
    return (
        <div className="glass-panel top-4 right-4 bottom-20 w-[250px] flex flex-col p-2 space-y-2">
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

            <button className="interactive-btn flex justify-between items-center p-2 border border-[#008080]/30 flex-1 max-h-12">
                <span className="tactical-label">SPACE-TRACK</span>
                <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-glow-cyan animate-pulse"></div>
            </button>

            <button className="interactive-btn flex justify-between items-center p-2 border border-neon-red/50 bg-neon-red/10 flex-1 max-h-12 shadow-[0_0_10px_rgba(255,49,49,0.2)]">
                <span className="tactical-label text-neon-red">EW/JAMMING</span>
                <div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_8px_rgba(255,49,49,0.8)]"></div>
            </button>
        </div>
    );
}
