'use client';

import React, { useEffect, useState } from 'react';
import { Entity, PolygonGraphics } from 'resium';
import * as Cesium from 'cesium';
import { cellToBoundary } from 'h3-js';
import { useTelemetryStore } from '@/store/telemetryStore';

// The new data structure defined in the Phase 5 API Contract
interface JammingCluster {
    h3_index: string;
    anomaly_score: number;
    entity_count: number;
    center_lat: number;
    center_lon: number;
}

interface HeatmapResponse {
    timestamp: number;
    resolution: number;
    clusters: JammingCluster[];
}

const COLOR_AMBER = Cesium.Color.fromCssColorString('#FFB300');
const COLOR_FUCHSIA = Cesium.Color.fromCssColorString('#FF00FF');

export default function JammingLayer() {
    const [clusters, setClusters] = useState<JammingCluster[]>([]);
    const { showJammingLayer, jammingOpacity, jammingTimeWindow } = useTelemetryStore();
    
    // Flag to ensure the polling starts cleanly
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        let isActive = true;

        const fetchHeatmap = async () => {
            try {
                // Determine API URL based on environment or fallback to localhost
                // @ts-ignore
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/jamming/heatmap?minutes_ago=${jammingTimeWindow}`);
                
                if (!res.ok) throw new Error('Failed to fetch jamming heatmap');
                
                const data: HeatmapResponse = await res.json();
                
                if (isActive) {
                    setClusters(data.clusters || []);
                }
            } catch (err) {
                console.warn('[JammingLayer] Fetch error:', err);
            }
        };

        if (!isPolling) {
            fetchHeatmap();
            setIsPolling(true);
        }

        const intervalId = setInterval(fetchHeatmap, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [isPolling, jammingTimeWindow]);

    if (!showJammingLayer) return null;

    return (
        <>
            {clusters.map((cluster: JammingCluster) => {
                let boundary;
                try {
                    // Uses h3-js to convert H3 hex index to lat/lon vertices
                    boundary = cellToBoundary(cluster.h3_index);
                } catch (e) {
                    return null; // Handle potentially invalid h3 indexes defensively
                }

                // Convert h3 boundary [lat, lon][] to Cesium degree array [lon, lat, lon, lat]
                const degreesArray: number[] = [];
                for (const [lat, lon] of boundary) {
                    degreesArray.push(lon, lat);
                }

                let hierarchy;
                try {
                    hierarchy = new Cesium.PolygonHierarchy(
                        Cesium.Cartesian3.fromDegreesArray(degreesArray)
                    );
                } catch (e) {
                    return null;
                }

                // Map anomaly_score (0.0 to 1.0) to Amber -> Fuchsia transition
                const lerpedColor = Cesium.Color.lerp(
                    COLOR_AMBER,
                    COLOR_FUCHSIA,
                    cluster.anomaly_score,
                    new Cesium.Color()
                );
                
                // Adjust transparency based on severity and global settings
                const fillAlpha = (0.3 + (cluster.anomaly_score * 0.3)) * jammingOpacity; 
                const fillColor = lerpedColor.withAlpha(fillAlpha);
                const outlineColor = lerpedColor.withAlpha(0.8 * jammingOpacity);

                return (
                    <Entity
                        key={cluster.h3_index}
                        name={`Jamming Cluster [${cluster.h3_index}]`}
                        description={`
                            <h3>Jamming Source Estimated</h3>
                            <p><b>Severity:</b> ${(cluster.anomaly_score * 100).toFixed(0)}%</p>
                            <p><b>Entities Affected:</b> ${cluster.entity_count}</p>
                            <p><b>Center:</b> ${cluster.center_lat.toFixed(4)}, ${cluster.center_lon.toFixed(4)}</p>
                        `}
                    >
                        <PolygonGraphics
                            hierarchy={hierarchy}
                            material={fillColor}
                            outline={true}
                            outlineColor={outlineColor}
                            outlineWidth={3}
                            // Ground clamping enforces the UX constraint that hexagons don't obscure models
                            zIndex={1} 
                        />
                    </Entity>
                );
            })}
        </>
    );
}
