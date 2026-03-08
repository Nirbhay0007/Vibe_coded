'use client';

import React, { useMemo } from 'react';
import { Entity, PointGraphics, PathGraphics } from 'resium';
import * as Cesium from 'cesium';
// Removed hardcoded ISS_TLE_LINE imports
import { getSatellitePosition } from '@/utils/orbitalMath';

interface LiveSatelliteProps {
    tleLine1: string;
    tleLine2: string;
    name: string;
}

export default function LiveSatellite({ tleLine1, tleLine2, name }: LiveSatelliteProps) {
    // CRITICAL: We use useMemo to create the CallbackProperty once.
    // This prevents React from re-rendering the Viewer while continuously updating position.
    const positionProperty = useMemo(() => {
        return new Cesium.CallbackPositionProperty((time: Cesium.JulianDate | undefined, result: Cesium.Cartesian3 | undefined) => {
            if (!time) return Cesium.Cartesian3.ZERO;

            // 1. Convert Cesium time to JS Date
            const date = Cesium.JulianDate.toDate(time);

            // 2. Fetch Geodetic components from the orbitalMath engine using dynamic props
            const pos = getSatellitePosition(tleLine1, tleLine2, date);

            if (!pos) {
                // Fallback to origin if propagation fails
                return Cesium.Cartesian3.ZERO;
            }

            // 3. Convert explicit Geodetic Degrees into a Cartesian3 coordinate 
            // Note: Cesium requires Longitude first
            const cartesianPosition = Cesium.Cartesian3.fromDegrees(
                pos.geodetic.longitude,
                pos.geodetic.latitude,
                pos.geodetic.altitude,
                Cesium.Ellipsoid.WGS84,
                result
            );

            return cartesianPosition;
        }, false); // false = not a constant value, changes over time
    }, []);

    return (
        <Entity
            name={name}
            position={positionProperty}
        >
            <PointGraphics
                pixelSize={8}
                color={Cesium.Color.fromCssColorString('#00E5FF')}
                outlineColor={Cesium.Color.fromCssColorString('#00E5FF').withAlpha(0.3)}
                outlineWidth={4}
            />
            <PathGraphics
                material={Cesium.Color.fromCssColorString('#00E5FF').withAlpha(0.5)}
                width={1}
                leadTime={0}
                trailTime={3600}
            />
        </Entity>
    );
}
