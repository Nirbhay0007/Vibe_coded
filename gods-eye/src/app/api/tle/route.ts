import { NextResponse } from 'next/server';

// Defining strictly typed response per Architectural Rule
export interface LiveTleResponse {
    name: string;
    tleLine1: string;
    tleLine2: string;
    timestamp: string;
}

// Ensure proper cache-control to prevent CelesTrak IP bans
export const revalidate = 3600; // Cache for 1 hour (3600 seconds)

export async function GET() {
    try {
        // Fetch live active space stations TLE text file
        const response = await fetch('https://celestrak.org/NORAD/elements/stations.txt', {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error(`CelesTrak API responded with status: ${response.status}`);
        }

        const textData = await response.text();

        // Parse the plain text response
        const lines = textData.split('\n').map(line => line.trim());

        let tleLine1 = '';
        let tleLine2 = '';
        let name = '';

        // Search for the exact string ISS (ZARYA)
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('ISS (ZARYA)')) {
                name = lines[i];

                // Extract the two lines immediately following the name
                if (i + 2 < lines.length) {
                    tleLine1 = lines[i + 1];
                    tleLine2 = lines[i + 2];
                }
                break;
            }
        }

        if (!tleLine1 || !tleLine2) {
            return NextResponse.json(
                { error: 'ISS (ZARYA) TLE data not found in the response' },
                { status: 404 }
            );
        }

        // Return strictly typed JSON payload
        const payload: LiveTleResponse = {
            name,
            tleLine1,
            tleLine2,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(payload);

    } catch (error: any) {
        console.error('Error fetching TLE data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch live TLE data', details: error.message },
            { status: 500 }
        );
    }
}
