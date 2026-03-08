export function GlobalStatusPanel() {
    return (
        <div className="glass-panel top-4 left-4 p-4 min-w-[300px]">
            <div className="flex justify-between border-b border-[#008080]/50 pb-2 mb-2">
                <h1 className="tactical-label text-neon-cyan">Global Heartbeat</h1>
                <span className="telemetry-data animate-pulse-osint">LIVE</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className="tactical-label">SGP4 ENGINE</span>
                    <span className="telemetry-data text-[#00E5FF]">ONLINE</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="tactical-label">API THROUGHPUT</span>
                    <span className="telemetry-data">94% CAP</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="tactical-label">JAMMING ALERT</span>
                    <span className="telemetry-data text-neon-red">SEC 7 ACTIVE</span>
                </div>
            </div>
        </div>
    );
}
