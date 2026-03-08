export async function GET() {
    // Hardcoded real ISS TLE to simulate Lead Architect's backend API 
    // until they connect it fully to Celestrak
    const data = {
        name: "ISS (ZARYA)",
        tleLine1: "1 25544U 98067A   24068.51474537  .00015501  00000-0  27993-3 0  9997",
        tleLine2: "2 25544  51.6416 351.1517 0005085 106.6343  18.7303 15.49814400442751"
    };

    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
    });
}
