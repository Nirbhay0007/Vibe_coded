'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Entity, PointGraphics, CylinderGraphics, BillboardGraphics, EllipseGraphics, useCesium } from 'resium';
import * as Cesium from 'cesium';
import { useTelemetryStore, TelemetryEntity } from '@/store/telemetryStore';

// ── Color constants (THEME.md compliance) ──────────────────────────
const COLOR_CYAN = Cesium.Color.fromCssColorString('#00E5FF');
const COLOR_TEAL = Cesium.Color.fromCssColorString('#008080');
const COLOR_FUCHSIA = Cesium.Color.fromCssColorString('#FF00FF');
const COLOR_PULSE_RED = Cesium.Color.fromCssColorString('#FF3131');
const COLOR_RADIOACTIVE_GREEN = Cesium.Color.fromCssColorString('#39FF14');
const OUTLINE_ALPHA = 0.3;

// ── SVG Constants for Billboards ──────────────────────────────────────
const createTacticalArrowSvg = (colorHex: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M16 2L30 30L16 22L2 30L16 2Z" fill="${colorHex}" stroke="${colorHex}" stroke-width="1" stroke-linejoin="round" />
</svg>
`;

/**
 * Tactical satellite silhouette: central body with two solar panel wings.
 * @param colorHex - Fill color in CSS hex format
 */
const createSatelliteSvg = (colorHex: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect x="18" y="14" width="12" height="20" rx="2" fill="${colorHex}" opacity="0.9"/>
  <rect x="2" y="18" width="14" height="12" rx="1" fill="${colorHex}" opacity="0.7"/>
  <rect x="32" y="18" width="14" height="12" rx="1" fill="${colorHex}" opacity="0.7"/>
  <line x1="16" y1="24" x2="18" y2="24" stroke="${colorHex}" stroke-width="2"/>
  <line x1="30" y1="24" x2="32" y2="24" stroke="${colorHex}" stroke-width="2"/>
  <circle cx="24" cy="22" r="2" fill="#000" opacity="0.5"/>
</svg>
`;
/**
 * Tactical Warship silhouette: Destroyer/Frigate profile.
 * Pointed bow, mast, and weapon stations.
 */
const createWarshipSvg = (colorHex: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="64" viewBox="0 0 32 64">
  <path d="M16 2L26 20L28 50L22 62L10 62L4 50L6 20L16 2Z" fill="${colorHex}" stroke="${colorHex}" stroke-width="0.5" opacity="0.95"/>
  <rect x="12" y="24" width="8" height="12" rx="1" fill="#000" opacity="0.3"/> <!-- Bridge/Mast -->
  <circle cx="16" cy="14" r="2" fill="#000" opacity="0.4"/> <!-- Forward Battery -->
  <rect x="14" y="44" width="4" height="8" rx="0.5" fill="#000" opacity="0.2"/> <!-- VLS Cells -->
  <line x1="16" y1="2" x2="16" y2="24" stroke="#000" stroke-width="0.5" opacity="0.2"/>
</svg>
`;

/**
 * Tactical Tanker silhouette: Large beam, flat stern, bridge aft.
 */
const createTankerSvg = (colorHex: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="72" viewBox="0 0 40 72">
  <path d="M20 2C20 2 34 16 34 24L34 60L28 70L12 70L6 60L6 24C6 16 20 2 20 2Z" fill="${colorHex}" opacity="0.9"/>
  <rect x="10" y="58" width="20" height="8" rx="1" fill="#000" opacity="0.3"/> <!-- Aft Bridge -->
  <rect x="14" y="22" width="12" height="30" rx="1" fill="#000" opacity="0.15"/> <!-- Pipe Deck -->
  <line x1="20" y1="2" x2="20" y2="58" stroke="#000" stroke-width="0.5" opacity="0.2"/>
</svg>
`;

/**
 * Tactical Boat/Craft silhouette: Small, fast profile.
 */
const createBoatSvg = (colorHex: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
  <path d="M12 2L20 14L18 28L12 30L6 28L4 14L12 2Z" fill="${colorHex}" opacity="0.95"/>
  <rect x="9" y="14" width="6" height="6" rx="1" fill="#000" opacity="0.3"/>
</svg>
`;

const AVIATION_SVG_URI = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(createTacticalArrowSvg('#00E5FF')) : ''}`;
const SATELLITE_SVG_URI = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(createSatelliteSvg('#39FF14')) : ''}`;

const WARSHIP_SVG_URI = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(createWarshipSvg('#00E5FF')) : ''}`;
const TANKER_SVG_URI = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(createTankerSvg('#008080')) : ''}`;
const BOAT_SVG_URI = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(createBoatSvg('#00FFE5')) : ''}`;
const MARITIME_DARK_SVG_URI = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(createWarshipSvg('#FF00FF')) : ''}`;


const WS_URL = 'ws://localhost:8000/ws/telemetry';

export default function SensorStreamLayer() {
    const cartesianCache = useRef<Map<string, Cesium.Cartesian3>>(new Map());
    const wsRef = useRef<WebSocket | null>(null);
    const flownOsintIds = useRef<Set<string>>(new Set());
    const { viewer } = useCesium();

    const updateEntities = useTelemetryStore((s) => s.updateEntities);
    const isLive = useTelemetryStore((s) => s.isLive);
    const entities = useTelemetryStore((s) => s.entities);
    const selectedEntityId = useTelemetryStore((s) => s.selectedEntityId);

    const [entityIds, setEntityIds] = React.useState<string[]>([]);

    // ── 1. Perfectly Sync Mutable Ref with Zustand Store ────────────
    useEffect(() => {
        const cache = cartesianCache.current;
        const currentIds = Object.keys(entities);

        // Update coordinates for all entities currently in the store
        for (const id of currentIds) {
            const entity = entities[id];
            if (entity) {
                cache.set(
                    id,
                    Cesium.Cartesian3.fromDegrees(
                        entity.longitude,
                        entity.latitude,
                        entity.altitude
                    )
                );
            }
        }

        // Purge removed entities from cache
        cache.forEach((_, id) => {
            if (!entities[id]) {
                cache.delete(id);
            }
        });

        // Update React rendering list
        setEntityIds(currentIds);
    }, [entities]);

    const lastLogTime = useRef<number>(0);

    // ── Connect / disconnect based on isLive ───────────────────────
    const connectWs = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('[SensorStream] WebSocket CONNECTED');
            // Sync Cesium clock to wall-clock with a 1.5s lag for jitter buffering
            if (viewer) {
                viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(Date.now() - 1500));
                viewer.clock.shouldAnimate = true;
                viewer.clock.multiplier = 1.0;
            }
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data) as {
                    type: string;
                    timestamp: string;
                    data: TelemetryEntity[];
                };
                if (payload.type !== 'telemetry_update') return;

                const incoming = payload.data;

                // Throttled log: print count of incoming data (max once every 2 seconds)
                if (Date.now() - lastLogTime.current > 2000) {
                    console.log("WS Payload Received. Count:", Object.keys(incoming).length);
                    lastLogTime.current = Date.now();
                }

                // Phase 4: The "God's Eye" Camera Move for osint_alert
                for (const entity of incoming) {
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

                    // ── Update SampledPositionProperty ──
                    // Convert backend Unix timestamp to JulianDate
                    const time = Cesium.JulianDate.fromDate(new Date(Number(payload.timestamp) * 1000));
                    const pos = Cesium.Cartesian3.fromDegrees(
                        entity.longitude,
                        entity.latitude,
                        entity.altitude
                    );

                    const sampledProp = getOrCreatePositionProperty(entity.entity_id);
                    sampledProp.addSample(time, pos);
                }

                // Let Zustand index and merge the incoming batch
                updateEntities(incoming);
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

    // ── SampledPositionProperty cache ──────────────────────────
    const sampledPositionCache = useRef<Map<string, Cesium.SampledPositionProperty>>(new Map());

    const getOrCreatePositionProperty = useCallback((entityId: string) => {
        if (sampledPositionCache.current.has(entityId)) {
            return sampledPositionCache.current.get(entityId)!;
        }

        const property = new Cesium.SampledPositionProperty();

        // Linear interpolation is robust for 1Hz updates
        property.setInterpolationOptions({
            interpolationDegree: 1,
            interpolationAlgorithm: Cesium.LinearApproximation,
        });

        // Keep the last sample if we stop receiving data
        property.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
        property.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;

        sampledPositionCache.current.set(entityId, property);
        return property;
    }, []);

    /** Called by the Time Machine when it fetches a historical snapshot */
    const pushSnapshot = useCallback(
        (snapshotData: TelemetryEntity[]) => {
            // Update the entities in the store
            updateEntities(snapshotData);

            // Also update the sampled position cache for immediate visualization
            // Use current clock time or the snapshot's intrinsic time if available
            if (viewer) {
                const now = viewer.clock.currentTime;
                for (const entity of snapshotData) {
                    const pos = Cesium.Cartesian3.fromDegrees(
                        entity.longitude,
                        entity.latitude,
                        entity.altitude
                    );
                    const sampledProp = getOrCreatePositionProperty(entity.entity_id);
                    sampledProp.addSample(now, pos);
                }
            }
        },
        [updateEntities, viewer, getOrCreatePositionProperty]
    );

    // Expose pushSnapshot on the window for the TimeMachine to call
    useEffect(() => {
        (window as unknown as Record<string, unknown>).__sensorPushSnapshot = pushSnapshot;
        return () => {
            delete (window as unknown as Record<string, unknown>).__sensorPushSnapshot;
        };
    }, [pushSnapshot]);

    // ── Rotation cache for BillboardGraphics ──────────────────────
    const rotationCache = useRef<Map<string, Cesium.CallbackProperty>>(new Map());

    const getOrCreateRotation = useCallback((entityId: string) => {
        if (rotationCache.current.has(entityId)) {
            return rotationCache.current.get(entityId)!;
        }

        const prop = new Cesium.CallbackProperty(
            (_time: Cesium.JulianDate | undefined) => {
                const entity = useTelemetryStore.getState().entities[entityId];
                // Tactical heading is clockwise from North (0°).
                // Cesium rotation is counter-clockwise. Negate to align.
                return -Cesium.Math.toRadians(entity?.heading || 0);
            },
            false
        );

        rotationCache.current.set(entityId, prop);
        return prop;
    }, []);

    // ── Orientation cache for physical steering ────────────────────
    const orientationCache = useRef<Map<string, Cesium.CallbackProperty>>(new Map());

    const getOrCreateOrientation = useCallback((entityId: string) => {
        if (orientationCache.current.has(entityId)) {
            return orientationCache.current.get(entityId)!;
        }

        const prop = new Cesium.CallbackProperty((_time, result) => {
            const entity = useTelemetryStore.getState().entities[entityId];
            if (!entity) return result;

            const pos = Cesium.Cartesian3.fromDegrees(
                entity.longitude,
                entity.latitude,
                entity.altitude || 0
            );

            // Standard tactical orientation: heading-pitch-roll
            const hpr = new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(entity.heading || 0),
                0, // Pitch
                0  // Roll
            );

            return Cesium.Transforms.headingPitchRollQuaternion(pos, hpr, Cesium.Ellipsoid.WGS84, undefined, result);
        }, false);

        orientationCache.current.set(entityId, prop);
        return prop;
    }, []);


    return (
        <>
            {entityIds.map((id) => {
                const meta = entities[id];
                if (!meta) return null;

                const isAviation = meta.domain === 'aviation';
                const isMaritime = meta.domain === 'maritime';
                const isDarkShip = isMaritime && meta.dark_ship === true;
                const isOsint = meta.domain === 'osint_alert';
                const isSpace = meta.domain === 'space';

                let pointColor: Cesium.Color;
                let outlineColor: Cesium.Color;
                if (isOsint) {
                    pointColor = COLOR_PULSE_RED;
                    outlineColor = COLOR_PULSE_RED.withAlpha(OUTLINE_ALPHA);
                } else if (isDarkShip) {
                    pointColor = COLOR_FUCHSIA;
                    outlineColor = COLOR_FUCHSIA.withAlpha(OUTLINE_ALPHA);
                } else if (isSpace) {
                    pointColor = COLOR_RADIOACTIVE_GREEN;
                    outlineColor = COLOR_RADIOACTIVE_GREEN.withAlpha(0.6);
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
                        name={isSpace && meta.name
                            ? `${meta.name}${meta.country ? ' [' + meta.country + ']' : ''}`
                            : `${meta.domain.toUpperCase()} | ${meta.entity_id}`}
                        position={getOrCreatePositionProperty(id)}
                        orientation={getOrCreateOrientation(id)}
                    >
                        {isAviation ? (
                            <BillboardGraphics
                                image={AVIATION_SVG_URI}
                                scale={0.25}
                                rotation={getOrCreateRotation(id)}
                            />
                        ) : isMaritime ? (
                            <BillboardGraphics
                                image={
                                    isDarkShip
                                        ? MARITIME_DARK_SVG_URI
                                        : meta.name === 'Warship'
                                            ? WARSHIP_SVG_URI
                                            : meta.name === 'Tanker'
                                                ? TANKER_SVG_URI
                                                : BOAT_SVG_URI
                                }
                                scale={meta.name === 'Tanker' ? 0.2 : meta.name === 'Warship' ? 0.18 : 0.15}
                                rotation={getOrCreateRotation(id)}
                                heightReference={Cesium.HeightReference.CLAMP_TO_GROUND}
                                eyeOffset={new Cesium.Cartesian3(0, 0, -500)}
                            />
                        ) : isSpace ? (
                            // Tactical satellite silhouette billboard for orbital tracks
                            <BillboardGraphics
                                image={SATELLITE_SVG_URI}
                                scale={0.45}
                                rotation={getOrCreateRotation(id)}
                            />
                        ) : (
                            <PointGraphics
                                pixelSize={isOsint ? 12 : 8}
                                color={pointColor}
                                outlineColor={outlineColor}
                                outlineWidth={isOsint ? 4 : 3}
                            />
                        )}
                        {isOsint && (
                            <CylinderGraphics
                                length={100000}
                                topRadius={50}
                                bottomRadius={10}
                                material={COLOR_PULSE_RED.withAlpha(0.6)}
                            />
                        )}
                        {isSpace && meta.altitude && meta.entity_id === selectedEntityId && (
                            <>
                                {/* Ground Footprint Circle (Nadir projection) */}
                                <EllipseGraphics
                                    semiMajorAxis={80000} // 80km tactical footprint
                                    semiMinorAxis={80000}
                                    height={0} // Force to ground
                                    heightReference={Cesium.HeightReference.CLAMP_TO_GROUND}
                                    material={COLOR_RADIOACTIVE_GREEN.withAlpha(0.08)}
                                    outline
                                    outlineColor={COLOR_RADIOACTIVE_GREEN.withAlpha(0.4)}
                                    outlineWidth={2}
                                />
                                {/* Tactical Vertical Tether Drop-Line (Satellite to Ground) */}
                                <Entity
                                    position={Cesium.Cartesian3.fromDegrees(meta.longitude, meta.latitude, 0)}
                                >
                                    <PointGraphics
                                        pixelSize={4}
                                        color={COLOR_RADIOACTIVE_GREEN}
                                        heightReference={Cesium.HeightReference.CLAMP_TO_GROUND}
                                    />
                                </Entity>
                            </>
                        )}
                    </Entity>
                );
            })}
        </>
    );
}
