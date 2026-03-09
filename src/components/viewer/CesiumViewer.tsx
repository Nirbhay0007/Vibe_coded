'use client';

import React, { useEffect, useRef } from 'react';
import { Viewer, useCesium } from 'resium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import LiveSatellite from '../LiveSatellite';
import SensorStreamLayer from '../SensorStreamLayer';
import JammingLayer from '../Tactical/JammingLayer';
import { useTelemetryStore } from '@/store/telemetryStore';

if (typeof window !== 'undefined') {
    (window as any).CESIUM_BASE_URL = '/Cesium';
}

/**
 * Inner component that has access to the Resium context (useCesium).
 * This is where we attach the ScreenSpaceEventHandler for scene.pick.
 */
function ScenePickHandler() {
    const { viewer } = useCesium();
    const selectEntity = useTelemetryStore((s) => s.selectEntity);
    const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

    useEffect(() => {
        if (!viewer) return;

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        handler.setInputAction(
            (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
                const picked = viewer.scene.pick(click.position);

                if (Cesium.defined(picked) && picked.id) {
                    // Extract ID safely. Resium Entities store their id in picked.id.id
                    const entityId = typeof picked.id === 'string' ? picked.id : picked.id.id;
                    if (entityId) {
                        selectEntity(entityId as string);
                    } else {
                        selectEntity(null);
                    }
                } else {
                    // Clicked empty space → deselect
                    selectEntity(null);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        handlerRef.current = handler;

        return () => {
            handler.destroy();
        };
    }, [viewer, selectEntity]);

    return null; // Renders nothing; purely an event‑binding side‑effect
}

/**
 * Inner component to handle initial regional pivot.
 */
function CameraInitializer() {
    const { viewer } = useCesium();

    useEffect(() => {
        if (!viewer) return;

        // Regional Pivot: Focus on Strait of Hormuz
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(56.3, 26.2, 800000.0),
            duration: 2.0
        });
    }, [viewer]);

    return null;
}

export default function CesiumViewer() {
    const [satelliteData, setSatelliteData] = React.useState<{
        name: string;
        tleLine1: string;
        tleLine2: string;
    } | null>(null);

    useEffect(() => {
        // Enforce WebGPU/optimized routing and performance constraints
        Cesium.RequestScheduler.maximumRequestsPerServer = 18;

        // Fetch live TLE from the Architect's backend API
        fetch('/api/tle')
            .then((res) => res.json())
            .then((data) => setSatelliteData(data))
            .catch((err) =>
                console.error('Failed to acquire satellite lock:', err)
            );
    }, []);

    // Memoize static props to prevent <Viewer> recreation (system.md constraint)
    const globe = React.useMemo(() => new Cesium.Globe(Cesium.Ellipsoid.WGS84), []);
    const skyAtmosphere = React.useMemo(() => new Cesium.SkyAtmosphere(), []);

    return (
        <Viewer
            full
            baseLayerPicker={false}
            timeline={false}
            animation={false}
            geocoder={false}
            homeButton={false}
            infoBox={false}
            selectionIndicator={false}
            navigationHelpButton={false}
            sceneModePicker={false}
            fullscreenButton={false}
            globe={globe}
            skyAtmosphere={skyAtmosphere}
            shouldAnimate={true}
        >
            {/* scene.pick click handler */}
            <ScenePickHandler />

            {/* Regional Pivot Initializer */}
            <CameraInitializer />

            {/* Live Orbital Tracker */}
            {satelliteData && (
                <LiveSatellite
                    name={satelliteData.name}
                    tleLine1={satelliteData.tleLine1}
                    tleLine2={satelliteData.tleLine2}
                />
            )}

            {/* Phase 2: Live WebSocket Sensor Stream */}
            <SensorStreamLayer />

            {/* Phase 3: Tactical Jamming Visualization (H3) */}
            <JammingLayer />
        </Viewer>
    );
}
