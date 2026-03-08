export function EntityInspector() {
    return (
        <div className="glass-panel bottom-20 left-4 p-4 w-[350px] transition-transform translate-x-0">
            <div className="border-b border-neon-cyan/30 pb-2 mb-3">
                <h2 className="tactical-label text-neon-amber">Entity Inspector</h2>
            </div>

            <div className="space-y-3">
                <div className="bg-[#020617]/50 p-2 border border-[#008080]/30 rounded-sm">
                    <span className="tactical-label block mb-1">IDENTIFICATION</span>
                    <div className="telemetry-data text-white">ICAO: A9C8F4</div>
                    <div className="telemetry-data text-slate-300">CALL: REACH88</div>
                </div>

                <div className="bg-[#020617]/50 p-2 border border-[#008080]/30 rounded-sm">
                    <span className="tactical-label block mb-1">SPATIAL DATA</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="tactical-label text-[8px]">LAT</span>
                            <div className="telemetry-data">34.0522° N</div>
                        </div>
                        <div>
                            <span className="tactical-label text-[8px]">LON</span>
                            <div className="telemetry-data">118.2437° W</div>
                        </div>
                        <div>
                            <span className="tactical-label text-[8px]">ALT (MSL)</span>
                            <div className="telemetry-data">34,000 FT</div>
                        </div>
                        <div>
                            <span className="tactical-label text-[8px]">SPD (GS)</span>
                            <div className="telemetry-data">450 KTS</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
