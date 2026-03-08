// @ts-ignore - satellite.js does not have official types available
import * as satellite from 'satellite.js';

export const ISS_TLE_LINE1 = "1 25544U 98067A   24068.51474537  .00015501  00000-0  27993-3 0  9997";
export const ISS_TLE_LINE2 = "2 25544  51.6416 351.1517 0005085 106.6343  18.7303 15.49814400442751";

export interface OrbitalPayload {
    eci: { x: number; y: number; z: number };
    geodetic: { latitude: number; longitude: number; altitude: number };
}

export const getSatellitePosition = (tleLine1: string, tleLine2: string, date: Date): OrbitalPayload | null => {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity) {
        return null;
    }

    const positionEci = positionAndVelocity.position;

    if (!positionEci || typeof positionEci === 'boolean') {
        return null;
    }

    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

    // Explicit conversion to Degrees
    const latitudeDeg = positionGd.latitude * (180 / Math.PI);
    const longitudeDeg = positionGd.longitude * (180 / Math.PI);
    const altitudeMeters = positionGd.height * 1000;

    return {
        eci: {
            x: positionEci.x as number,
            y: positionEci.y as number,
            z: positionEci.z as number
        },
        geodetic: {
            latitude: latitudeDeg,
            longitude: longitudeDeg,
            altitude: altitudeMeters
        }
    };
};
