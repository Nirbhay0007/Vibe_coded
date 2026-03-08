'use client';

import React, { useEffect } from 'react';
import { Viewer, PointGraphics, Entity, PathGraphics } from 'resium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import LiveSatellite from '../LiveSatellite';

if (typeof window !== 'undefined') {
    (window as any).CESIUM_BASE_URL = '/Cesium';
}

export default function CesiumViewer() {
    const [satelliteData, setSatelliteData] = React.useState<{ name: string; tleLine1: string; tleLine2: string } | null>(null);

    useEffect(() => {
        // Enforce WebGPU/optimized routing and performance constraints from system.md
        Cesium.RequestScheduler.maximumRequestsPerServer = 18;

        // Fetch live TLE from the Architect's backend API
        fetch('/api/tle')
            .then(res => res.json())
            .then(data => setSatelliteData(data))
            .catch(err => console.error('Failed to acquire satellite lock:', err));
    }, []);

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
            // Tactical settings
            globe={new Cesium.Globe(Cesium.Ellipsoid.WGS84)}
            skyAtmosphere={new Cesium.SkyAtmosphere()}
        >
            {/* 5. CESIUM 3D ENTITY SYMBOLOGY - Live Engine Tracker */}
            {satelliteData && (
                <LiveSatellite
                    name={satelliteData.name}
                    tleLine1={satelliteData.tleLine1}
                    tleLine2={satelliteData.tleLine2}
                />
            )}

            {/* Example Hostile Anomaly Data Point (Fuchsia) */}
            <Entity
                position={Cesium.Cartesian3.fromDegrees(-110.0, 35.0, 5000.0)}
                name="DARK SHIP ANOMALY"
            >
                <PointGraphics
                    pixelSize={8}
                    color={Cesium.Color.fromCssColorString('#FF00FF')}
                />
            </Entity>
        </Viewer>
    );
}
