export function TimeMachineScrubber() {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#020617]/90 border-t border-[#008080] flex items-center px-8 z-40 pointer-events-auto shadow-[0_-5px_15px_rgba(0,128,128,0.1)]">
            <div className="flex items-center gap-4 w-full">
                <button className="interactive-btn px-3 py-1 border border-[#008080]/50 rounded-sm">
                    <span className="tactical-label">LIVE</span>
                </button>

                <div className="flex-1 relative flex items-center h-full">
                    {/* Deep Teal Track */}
                    <div className="absolute left-0 right-0 h-1 bg-[#008080]/30 rounded-full"></div>
                    {/* Amber progress handle */}
                    <div className="absolute left-[75%] h-full flex flex-col items-center justify-center translate-x-[-50%]">
                        <div className="h-4 w-1 bg-neon-amber shadow-[0_0_8px_rgba(255,179,0,0.8)] cursor-grab"></div>
                        <span className="telemetry-data absolute -top-5 text-neon-amber">13:00:24Z</span>
                    </div>
                </div>

                <button className="interactive-btn px-3 py-1 border border-[#008080]/50 rounded-sm">
                    <span className="tactical-label">SYNC</span>
                </button>
            </div>
        </div>
    );
}
