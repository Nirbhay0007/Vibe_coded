from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        payload_len = len(message.get('data', []) if isinstance(message, dict) and 'data' in message else message)
        
        if payload_len == 0:
            print("WARNING: Broadcasting empty payload (0 entities)")
        
        for connection in list(self.active_connections):
            print(f"Broadcasting {payload_len} entities to {len(self.active_connections)} clients")
            try:
                await connection.send_json(message)
            except Exception:
                # Handle disconnected clients gracefully
                self.disconnect(connection)

manager = ConnectionManager()
