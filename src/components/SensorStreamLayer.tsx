'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Entity, PointGraphics, CylinderGraphics, useCesium } from 'resium';
import * as Cesium from 'cesium';
import { useTelemetryStore, TelemetryEntity } from '@/store/telemetryStore';

// ── Color constants (THEME.md compliance) ──────────────────────────
const COLOR_CYAN = Cesium.Color.fromCssColorString('#00E5FF');
const COLOR_TEAL = Cesium.Color.fromCssColorString('#008080');
const COLOR_FUCHSIA = Cesium.Color.fromCssColorString('#FF00FF');
const COLOR_PULSE_RED = Cesium.Color.fromCssColorString('#FF3131');
const OUTLINE_ALPHA = 0.3;

const WS_URL = 'ws://localhost:8000/ws/telemetry';

export default function SensorStreamLayer() {
    const cartesianCache = useRef<Map<string, Cesium.Cartesian3>>(new Map());
    const wsRef = useRef<WebSocket | null>(null);
    const flownOsintIds = useRef<Set<string>>(new Set());
    const { viewer } = useCesium();

    const updateEntities = useTelemetryStore((s) => s.updateEntities);
    const isLive = useTelemetryStore((s) => s.isLive);

    const [entityIds, setEntityIds] = React.useState<string[]>([]);

    // ── Connect / disconnect based on isLive ───────────────────────
    const connectWs = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => console.log('[SensorStream] WebSocket CONNECTED');

        ws.onmessage = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data) as {
                    type: string;
                    timestamp: string;
                    data: TelemetryEntity[];
                };
                if (payload.type !== 'telemetry_update') return;

                const incoming = payload.data;
                const cache = cartesianCache.current;
                const freshIds: string[] = [];

                for (const entity of incoming) {
                    freshIds.push(entity.entity_id);
                    cache.set(
                        entity.entity_id,
                        Cesium.Cartesian3.fromDegrees(
                            entity.longitude,
                            entity.latitude,
                            entity.altitude
                        )
                    );

                    // Phase 4: The "God's Eye" Camera Move for osint_alert
                    if (entity.domain === 'osint_alert' && !flownOsintIds.current.has(entity.entity_id)) {
                        flownOsintIds.current.add(entity.entity_id);
                        if (viewer && viewer.camera) {
                            viewer.camera.flyTo({
                                destination: Cesium.Cartesian3.fromDegrees(
                                    entity.longitude,
                                    entity.latitude,
                                    50000
                                ),
                                orientation: {
                                    heading: 0.0,
                                    pitch: Cesium.Math.toRadians(-60.0), // high-angle tactical pitch
                                    roll: 0.0
                                },
                                duration: 2.0
                            });
                        }
                    }
                }

                for (const id of cache.keys()) {
                    if (!freshIds.includes(id)) cache.delete(id);
                }

                updateEntities(incoming);
                setEntityIds(freshIds);
            } catch (err) {
                console.error('[SensorStream] Parse error:', err);
            }
        };

        ws.onclose = () => {
            console.warn('[SensorStream] WebSocket CLOSED');
            wsRef.current = null;
        };

        ws.onerror = () => ws.close();

        wsRef.current = ws;
    }, [updateEntities, viewer]);

    const disconnectWs = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    // Expose connect/disconnect for Time Machine via a global hook
    useEffect(() => {
        if (isLive) {
            connectWs();
        } else {
            disconnectWs();
        }
        return () => disconnectWs();
    }, [isLive, connectWs, disconnectWs]);

    /** Called by the Time Machine when it fetches a historical snapshot */
    const pushSnapshot = useCallback(
        (entities: TelemetryEntity[]) => {
            const cache = cartesianCache.current;
            const ids: string[] = [];

            cache.clear();
            for (const entity of entities) {
                ids.push(entity.entity_id);
                cache.set(
                    entity.entity_id,
                    Cesium.Cartesian3.fromDegrees(
                        entity.longitude,
                        entity.latitude,
                        entity.altitude
                    )
                );
            }

            updateEntities(entities);
            setEntityIds(ids);
        },
        [updateEntities]
    );

    // Expose pushSnapshot on the window for the TimeMachine to call
    useEffect(() => {
        (window as unknown as Record<string, unknown>).__sensorPushSnapshot = pushSnapshot;
        return () => {
            delete (window as unknown as Record<string, unknown>).__sensorPushSnapshot;
        };
    }, [pushSnapshot]);

    // ── CallbackProperty cache ──────────────────────────────────
    const propertyCache = useRef<Map<string, Cesium.CallbackPositionProperty>>(new Map());

    const getOrCreateProperty = useCallback((entityId: string) => {
        if (propertyCache.current.has(entityId)) {
            return propertyCache.current.get(entityId)!;
        }

        const prop = new Cesium.CallbackPositionProperty(
            (_time: Cesium.JulianDate | undefined) => {
                return cartesianCache.current.get(entityId) ?? Cesium.Cartesian3.ZERO;
            },
            false
        );

        propertyCache.current.set(entityId, prop);
        return prop;
    }, []);

    const entities = useTelemetryStore((s) => s.entities);

    return (
        <>
            {entityIds.map((id) => {
                const meta = entities[id];
                if (!meta) return null;

                const isAviation = meta.domain === 'aviation';
                const isDarkShip = meta.domain === 'maritime' && meta.dark_ship === true;
                const isOsint = meta.domain === 'osint_alert';

                let pointColor: Cesium.Color;
                let outlineColor: Cesium.Color;
                if (isOsint) {
                    pointColor = COLOR_PULSE_RED;
                    outlineColor = COLOR_PULSE_RED.withAlpha(OUTLINE_ALPHA);
                } else if (isDarkShip) {
                    pointColor = COLOR_FUCHSIA;
                    outlineColor = COLOR_FUCHSIA.withAlpha(OUTLINE_ALPHA);
                } else if (isAviation) {
                    pointColor = COLOR_CYAN;
                    outlineColor = COLOR_CYAN.withAlpha(OUTLINE_ALPHA);
                } else {
                    pointColor = COLOR_TEAL;
                    outlineColor = COLOR_TEAL.withAlpha(OUTLINE_ALPHA);
                }

                return (
                    <Entity
                        key={id}
                        id={id}
                        name={`${meta.domain.toUpperCase()} | ${meta.entity_id}`}
                        position={getOrCreateProperty(id)}
                    >
                        <PointGraphics
                            pixelSize={isOsint ? 12 : isAviation ? 6 : 8}
                            color={pointColor}
                            outlineColor={outlineColor}
                            outlineWidth={isOsint ? 4 : 3}
                        />
                        {isOsint && (
                            <CylinderGraphics
                                length={100000} // Drops from 50,000m down (and goes 50,000m down into earth, which is fine)
                                topRadius={50}
                                bottomRadius={10}
                                material={COLOR_PULSE_RED.withAlpha(0.6)}
                            />
                        )}
                    </Entity>
                );
            })}
        </>
    );
}
