"""
Synthra Real-Time Collaboration Service
WebSocket server for live schematic editing, CRDT-based conflict resolution,
and real-time code generation streaming.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Set, List, Any, Optional
import json
import asyncio
import uuid
from datetime import datetime
import redis.asyncio as redis
import httpx


app = FastAPI(
    title="Synthra Real-Time Service",
    version="1.0.0",
    description="WebSocket server for collaborative schematic editing"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Data Models
# ============================================================================

class SchematicChange(BaseModel):
    """CRDT-based schematic change"""
    change_id: str
    room_id: str
    user_id: str
    timestamp: int  # Lamport timestamp for ordering
    operation: str  # 'add_component', 'move_component', 'delete_component', 'add_wire', 'delete_wire'
    data: Dict[str, Any]
    vector_clock: Dict[str, int]  # For causal ordering


class RoomState(BaseModel):
    """Current state of a schematic editing room"""
    room_id: str
    components: List[Dict[str, Any]]
    wires: List[Dict[str, Any]]
    version: int
    last_updated: datetime


# ============================================================================
# Connection Manager
# ============================================================================

class ConnectionManager:
    """
    Manages WebSocket connections for real-time collaboration.
    Supports rooms, broadcasting, and presence tracking.
    """
    
    def __init__(self):
        # room_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
        # room_id -> RoomState
        self.room_states: Dict[str, RoomState] = {}
        
        # websocket -> user_info
        self.user_info: Dict[WebSocket, Dict[str, str]] = {}
        
        # Redis for pub/sub across multiple server instances
        self.redis: Optional[redis.Redis] = None
    
    async def initialize_redis(self, redis_url: str):
        """Connect to Redis for distributed pub/sub"""
        try:
            self.redis = await redis.from_url(redis_url, decode_responses=True)
            print("✓ Connected to Redis for pub/sub")
        except Exception as e:
            print(f"⚠ Redis connection failed: {e}")
            self.redis = None
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, username: str):
        """Accept WebSocket connection and join room"""
        await websocket.accept()
        
        # Initialize room if doesn't exist
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
            self.room_states[room_id] = RoomState(
                room_id=room_id,
                components=[],
                wires=[],
                version=0,
                last_updated=datetime.utcnow()
            )
        
        # Add connection to room
        self.active_connections[room_id].add(websocket)
        
        # Store user info
        self.user_info[websocket] = {
            "user_id": user_id,
            "username": username,
            "room_id": room_id
        }
        
        # Send current room state to new user
        await websocket.send_json({
            "type": "room_state",
            "data": self.room_states[room_id].dict()
        })
        
        # Broadcast user joined event
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude=websocket)
        
        print(f"✓ User {username} joined room {room_id} ({len(self.active_connections[room_id])} users)")
    
    async def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket not in self.user_info:
            return
        
        user_data = self.user_info[websocket]
        room_id = user_data["room_id"]
        username = user_data["username"]
        user_id = user_data["user_id"]
        
        # Remove from room
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            
            # Clean up empty rooms
            if len(self.active_connections[room_id]) == 0:
                del self.active_connections[room_id]
                del self.room_states[room_id]
                print(f"✓ Room {room_id} closed (no users remaining)")
            else:
                # Broadcast user left event
                await self.broadcast_to_room(room_id, {
                    "type": "user_left",
                    "user_id": user_id,
                    "username": username,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # Remove user info
        del self.user_info[websocket]
        
        print(f"✓ User {username} left room {room_id}")
    
    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any], exclude: Optional[WebSocket] = None):
        """Broadcast message to all users in room"""
        if room_id not in self.active_connections:
            return
        
        # Send to all connections in room
        disconnected = []
        for connection in self.active_connections[room_id]:
            if connection == exclude:
                continue
            
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        
        # Clean up disconnected websockets
        for connection in disconnected:
            await self.disconnect(connection)
    
    async def apply_change(self, room_id: str, change: SchematicChange) -> bool:
        """
        Apply CRDT-based change to room state with conflict resolution.
        Returns True if applied, False if conflict detected.
        """
        if room_id not in self.room_states:
            return False
        
        state = self.room_states[room_id]
        
        # Apply operation based on type
        if change.operation == "add_component":
            # Check if component already exists (conflict)
            component_id = change.data.get("id")
            if any(c.get("id") == component_id for c in state.components):
                # Resolve conflict: later timestamp wins
                existing = next(c for c in state.components if c.get("id") == component_id)
                if change.timestamp > existing.get("timestamp", 0):
                    state.components = [c for c in state.components if c.get("id") != component_id]
                    state.components.append(change.data)
            else:
                state.components.append(change.data)
        
        elif change.operation == "move_component":
            component_id = change.data.get("id")
            for component in state.components:
                if component.get("id") == component_id:
                    component["position"] = change.data.get("position")
                    component["timestamp"] = change.timestamp
                    break
        
        elif change.operation == "delete_component":
            component_id = change.data.get("id")
            state.components = [c for c in state.components if c.get("id") != component_id]
        
        elif change.operation == "add_wire":
            wire_id = change.data.get("id")
            if not any(w.get("id") == wire_id for w in state.wires):
                state.wires.append(change.data)
        
        elif change.operation == "delete_wire":
            wire_id = change.data.get("id")
            state.wires = [w for w in state.wires if w.get("id") != wire_id]
        
        # Update version and timestamp
        state.version += 1
        state.last_updated = datetime.utcnow()
        
        return True
    
    def get_room_users(self, room_id: str) -> List[Dict[str, str]]:
        """Get list of users in room"""
        if room_id not in self.active_connections:
            return []
        
        users = []
        for websocket in self.active_connections[room_id]:
            if websocket in self.user_info:
                user_data = self.user_info[websocket]
                users.append({
                    "user_id": user_data["user_id"],
                    "username": user_data["username"]
                })
        
        return users


# Global connection manager
manager = ConnectionManager()


# ============================================================================
# Startup & Shutdown
# ============================================================================

@app.on_event("startup")
async def startup():
    """Initialize Redis connection on startup"""
    import os
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
    await manager.initialize_redis(redis_url)


# ============================================================================
# REST Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "realtime",
        "status": "healthy",
        "version": "1.0.0",
        "active_rooms": len(manager.active_connections),
        "total_connections": sum(len(conns) for conns in manager.active_connections.values())
    }


@app.get("/api/rooms")
async def list_rooms():
    """List all active rooms"""
    rooms = []
    for room_id, connections in manager.active_connections.items():
        state = manager.room_states.get(room_id)
        rooms.append({
            "room_id": room_id,
            "user_count": len(connections),
            "users": manager.get_room_users(room_id),
            "version": state.version if state else 0,
            "component_count": len(state.components) if state else 0
        })
    
    return {"rooms": rooms}


@app.get("/api/room/{room_id}/state")
async def get_room_state(room_id: str):
    """Get current state of a room"""
    if room_id not in manager.room_states:
        raise HTTPException(status_code=404, detail="Room not found")
    
    state = manager.room_states[room_id]
    return {
        "room_id": room_id,
        "state": state.dict(),
        "users": manager.get_room_users(room_id)
    }


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str = None, username: str = "Anonymous"):
    """
    WebSocket endpoint for real-time collaboration
    
    Query params:
        - user_id: Unique user identifier
        - username: Display name
    
    Message types:
        Client -> Server:
            - change: Apply schematic change
            - cursor: Update cursor position
            - generate: Request live code generation
        
        Server -> Client:
            - room_state: Current room state (on join)
            - change_applied: Change broadcast to all users
            - user_joined/user_left: Presence updates
            - cursor_update: Other users' cursor positions
            - code_update: Live generated code (netlist/HDL)
    """
    
    # Generate user_id if not provided
    if not user_id:
        user_id = str(uuid.uuid4())
    
    # Connect user to room
    await manager.connect(websocket, room_id, user_id, username)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "change":
                # Apply schematic change with CRDT
                change = SchematicChange(
                    change_id=str(uuid.uuid4()),
                    room_id=room_id,
                    user_id=user_id,
                    timestamp=data.get("timestamp", 0),
                    operation=data.get("operation"),
                    data=data.get("data"),
                    vector_clock=data.get("vector_clock", {})
                )
                
                # Apply to state
                success = await manager.apply_change(room_id, change)
                
                if success:
                    # Broadcast change to all users
                    await manager.broadcast_to_room(room_id, {
                        "type": "change_applied",
                        "change": change.dict()
                    })
                    
                    # Trigger live code generation in background
                    asyncio.create_task(generate_live_code(room_id, manager.room_states[room_id]))
            
            elif message_type == "cursor":
                # Broadcast cursor position
                await manager.broadcast_to_room(room_id, {
                    "type": "cursor_update",
                    "user_id": user_id,
                    "username": username,
                    "position": data.get("position")
                }, exclude=websocket)
            
            elif message_type == "generate":
                # Manual code generation request
                state = manager.room_states.get(room_id)
                if state:
                    await generate_live_code(room_id, state)
    
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await manager.disconnect(websocket)


# ============================================================================
# Live Code Generation
# ============================================================================

async def generate_live_code(room_id: str, state: RoomState):
    """
    Generate netlist and HDL code from current schematic state.
    Stream updates back to all users in room via WebSocket.
    """
    try:
        # Build circuit data from room state
        circuit_data = {
            "components": state.components,
            "nodes": extract_nodes_from_wires(state.wires)
        }
        
        # Call Core service for code generation
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Generate netlist
            netlist_response = await client.post(
                "http://core:8000/api/generate-netlist",
                json=circuit_data
            )
            
            if netlist_response.status_code == 200:
                netlist = netlist_response.json().get("netlist", "")
                
                # Broadcast netlist update
                await manager.broadcast_to_room(room_id, {
                    "type": "code_update",
                    "code_type": "netlist",
                    "content": netlist,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Generate HDL
            hdl_response = await client.post(
                "http://core:8000/api/generate-hdl",
                json=circuit_data
            )
            
            if hdl_response.status_code == 200:
                hdl = hdl_response.json().get("verilog", "")
                
                # Broadcast HDL update
                await manager.broadcast_to_room(room_id, {
                    "type": "code_update",
                    "code_type": "hdl",
                    "content": hdl,
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except Exception as e:
        print(f"Live code generation error: {e}")


def extract_nodes_from_wires(wires: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert wire list to node topology for netlist generation"""
    nodes = []
    
    # Build connectivity graph
    connections = {}  # node_id -> list of component pins
    
    for wire in wires:
        from_pin = wire.get("from")
        to_pin = wire.get("to")
        
        # Assign node IDs based on connectivity
        # This is simplified - production would use graph algorithms
        node_id = wire.get("node_id", str(uuid.uuid4()))
        
        if node_id not in connections:
            connections[node_id] = []
        
        connections[node_id].extend([from_pin, to_pin])
    
    # Convert to node format
    for node_id, pins in connections.items():
        nodes.append({
            "id": node_id,
            "pins": list(set(pins))  # Remove duplicates
        })
    
    return nodes


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
