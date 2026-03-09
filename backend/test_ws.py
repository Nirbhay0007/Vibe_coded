import asyncio
import websockets
import json
import sys

async def test_websocket():
    uri = "ws://localhost:8000/ws/telemetry"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket successfully.")
            
            # Wait for one telemetry payload
            print("Waiting for payload...")
            response = await asyncio.wait_for(websocket.recv(), timeout=15.0)
            
            payload = json.loads(response)
            
            print("\n----- PAYLOAD RECEIVED -----")
            print(f"Update Type: {payload.get('type')}")
            print(f"Timestamp: {payload.get('timestamp')}")
            
            data = payload.get('data', [])
            print(f"Entities tracking: {len(data)}")
            
            if len(data) > 0:
                sample = data[0]
                print(f"Sample Entity: {sample['entity_id']} ({sample['domain']})")
                print(f"Position: {sample['latitude']}, {sample['longitude']}, {sample['altitude']}")
                print(f"Vectors: Velocity={sample['velocity']}, Heading={sample['heading']}")
            
            print("----------------------------\n")
            
            # Verify structure against architectural constraints
            if 'latitude' in sample and 'longitude' in sample:
                print("SUCCESS: 4D Positional Data Present.")
                sys.exit(0)
            else:
                print("ERROR: Corrupted schema.")
                sys.exit(1)
                
    except Exception as e:
        print(f"WebSocket connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_websocket())
