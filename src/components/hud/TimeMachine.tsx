'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTelemetryStore, TelemetryEntity } from '@/store/telemetryStore';

const HISTORY_API = 'http://localhost:8000';

interface TimeRange {
    earliest: number; // Unix timestamp
    latest: number;   // Unix timestamp
}

export function TimeMachine() {
    const isLive = useTelemetryStore((s) => s.isLive);
    const setLive = useTelemetryStore((s) => s.setLive);

    const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
    const [sliderValue, setSliderValue] = useState<number>(100); // 0–100 %
    const [displayTime, setDisplayTime] = useState<string>('LIVE');
    const fetchingRef = useRef(false);

    // ── Fetch time-range bounds on mount ────────────────────────────
    useEffect(() => {
        fetch(`${HISTORY_API}/api/history/timerange`)
            .then((r) => r.json())
            .then((data: TimeRange) => {
                if (data.earliest) {
                    setTimeRange(data);
                }
            })
            .catch(() => {
                // Fallback: use a 1-hour window from now
                const now = Date.now() / 1000;
                setTimeRange({
                    earliest: now - 3600,
                    latest: now,
                });
            });
    }, []);

    // ── Convert slider % → Unix timestamp ────────────────────────────
    const sliderToTimestamp = useCallback(
        (pct: number): number => {
            if (!timeRange) return Date.now() / 1000;
            const min = timeRange.earliest;
            const max = timeRange.latest;
            return min + (pct / 100) * (max - min);
        },
        [timeRange]
    );

    // ── Handle slider drag ──────────────────────────────────────────
    const handleSliderChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = Number(e.target.value);
            setSliderValue(val);

            if (val >= 99) {
                // Snap to live
                if (!isLive) {
                    setLive(true);
                    setDisplayTime('LIVE');
                }
                return;
            }

            // Enter playback mode
            if (isLive) setLive(false);

            const ts = sliderToTimestamp(val);
            const d = new Date(ts * 1000); // Convert seconds to ms for JS Date
            setDisplayTime(
                `${d.getUTCHours().toString().padStart(2, '0')}:${d
                    .getUTCMinutes()
                    .toString()
                    .padStart(2, '0')}:${d
                        .getUTCSeconds()
                        .toString()
                        .padStart(2, '0')}Z`
            );

            // Debounced snapshot fetch
            if (!fetchingRef.current) {
                fetchingRef.current = true;
                fetch(`${HISTORY_API}/api/history/snapshot?timestamp=${ts}`)
                    .then((r) => r.json())
                    .then((data: { data: TelemetryEntity[] }) => {
                        // Push into SensorStreamLayer's Cartesian cache
                        const push = (
                            window as unknown as Record<string, unknown>
                        ).__sensorPushSnapshot as
                            | ((e: TelemetryEntity[]) => void)
                            | undefined;
                        if (push) push(data.data);
                    })
                    .catch((err) =>
                        console.error('[TimeMachine] Snapshot fetch error:', err)
                    )
                    .finally(() => {
                        fetchingRef.current = false;
                    });
            }
        },
        [isLive, setLive, sliderToTimestamp]
    );

    // ── Snap back to live ───────────────────────────────────────────
    const handleGoLive = useCallback(() => {
        setLive(true);
        setSliderValue(100);
        setDisplayTime('LIVE');
    }, [setLive]);

    return (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#020617]/90 border-t border-neon-teal flex items-center px-6 z-40 pointer-events-auto shadow-[0_-5px_15px_rgba(0,128,128,0.1)] rounded-none">
            {/* LIVE button */}
            <button
                onClick={handleGoLive}
                className={`interactive-btn mr-4 px-3 py-1 border rounded-none font-mono text-[11px] tabular-nums uppercase tracking-widest transition-all duration-300 ${isLive
                    ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan'
                    : 'border-neon-teal/50 text-slate-500 hover:text-neon-cyan'
                    }`}
            >
                LIVE
            </button>

            {/* Slider track */}
            <div className="flex-1 relative flex items-center">
                <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="w-full h-1 appearance-none cursor-pointer rounded-none
                        [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-neon-teal/30 [&::-webkit-slider-runnable-track]:rounded-none
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:bg-neon-amber [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,179,0,0.8)] [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:-mt-1.5
                        [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-neon-teal/30 [&::-moz-range-track]:rounded-none
                        [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:bg-neon-amber [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(255,179,0,0.8)] [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-grab"
                />
            </div>

            {/* Timestamp display */}
            <div className="ml-4 min-w-[100px] text-right">
                <span
                    className={`font-mono text-[11px] tabular-nums tracking-tight ${isLive ? 'text-neon-cyan animate-pulse' : 'text-neon-amber'
                        }`}
                >
                    {displayTime}
                </span>
            </div>
        </div>
    );
}
