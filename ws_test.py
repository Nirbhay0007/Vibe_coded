import asyncio
import websockets
import json
import time

async def test_ws():
    uri = "ws://localhost:8000/ws/telemetry"
    try:
        async with websockets.connect(uri) as ws:
            print("Connected to WS")
            start = time.time()
            count = 0
            while count < 3:
                msg = await ws.recv()
                data = json.loads(msg)
                print(f"[{time.time()-start:.2f}s] Received {len(data['data'])} entities")
                count += 1
            print("Successfully received 1Hz updates.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
