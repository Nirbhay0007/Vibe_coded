'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PolygonGraphics, Entity } from 'resium';
import * as Cesium from 'cesium';
import * as h3 from 'h3-js';
import { useTelemetryStore, TelemetryEntity } from '@/store/telemetryStore';

// ── Configuration ──────────────────────────────────────────────────
const H3_RESOLUTION = 6;
const JAMMING_THRESHOLD_JITTER = 10.0; // Simulated threshold for jamming detection
const JAMMING_THRESHOLD_NIC = 4;      // Metrics below this NIC are suspect
const UPDATE_INTERVAL_MS = 2000;       // Aggregation loop frequency
const PULSE_SPEED = 0.002;             // Alpha oscillation speed

// ── Theme (THEME.md) ───────────────────────────────────────────────
const COLOR_NEON_RED = Cesium.Color.fromCssColorString('#FF3131');
const BASE_ALPHA = 0.3;

interface JammingCell {
    h3Index: string;
    intensity: number; // 0.0 to 1.0 (normalized)
    center: Cesium.Cartesian3;
    boundary: Cesium.Cartesian3[];
}

export default function JammingLayer() {
    const entities = useTelemetryStore((s) => s.entities);
    const [jammingCells, setJammingCells] = useState<JammingCell[]>([]);
    const [pulseAlpha, setPulseAlpha] = useState(BASE_ALPHA);

    // ── Animation Loop: Pulsing Effect ─────────────────────────────
    useEffect(() => {
        let frame: number;
        const animate = (time: number) => {
            const alpha = BASE_ALPHA + Math.sin(time * PULSE_SPEED) * 0.15;
            setPulseAlpha(alpha);
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    // ── Aggregation Loop: H3 Jamming Detection ────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const cells = new Map<string, { count: number; totalJitter: number; lowNicCount: number }>();

            // 1. Group entities into H3 hexagons and sum metrics
            Object.values(entities).forEach((entity) => {
                const h3Index = h3.latLngToCell(entity.latitude, entity.longitude, H3_RESOLUTION);
                const stats = cells.get(h3Index) || { count: 0, totalJitter: 0, lowNicCount: 0 };

                stats.count++;
                stats.totalJitter += entity.jitter || 0;
                if ((entity.nic ?? 10) < JAMMING_THRESHOLD_NIC) {
                    stats.lowNicCount++;
                }

                cells.set(h3Index, stats);
            });

            // 2. Identify "Jamming" cells based on heuristic
            const detected: JammingCell[] = [];
            cells.forEach((stats, h3Index) => {
                const avgJitter = stats.totalJitter / stats.count;
                const isSuspect = avgJitter > JAMMING_THRESHOLD_JITTER || stats.lowNicCount > 0;

                if (isSuspect) {
                    const boundaryCoords = h3.cellToBoundary(h3Index);
                    const boundary = boundaryCoords.map(
                        (coord) => Cesium.Cartesian3.fromDegrees(coord[1], coord[0])
                    );
                    const centerCoord = h3.cellToLatLng(h3Index);
                    const center = Cesium.Cartesian3.fromDegrees(centerCoord[1], centerCoord[0]);

                    detected.push({
                        h3Index,
                        intensity: Math.min(stats.count / 5, 1.0), // Intensity scales with entity density
                        center,
                        boundary
                    });
                }
            });

            setJammingCells(detected);
        }, UPDATE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [entities]);

    return (
        <>
            {jammingCells.map((cell) => (
                <Entity
                    key={cell.h3Index}
                    name={`EW JAMMING ZONE | ${cell.h3Index}`}
                    position={cell.center}
                >
                    <PolygonGraphics
                        hierarchy={new Cesium.PolygonHierarchy(cell.boundary)}
                        material={new Cesium.ColorMaterialProperty(
                            COLOR_NEON_RED.withAlpha(pulseAlpha * cell.intensity)
                        )}
                        outline={true}
                        outlineColor={COLOR_NEON_RED}
                        outlineWidth={1}
                        height={50} // Slightly above ground
                    />
                </Entity>
            ))}
        </>
    );
}
