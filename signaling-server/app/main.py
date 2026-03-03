"""
y-webrtc compatible signaling server for Vigma multiplayer.
Implements the same pub/sub WebSocket relay protocol as y-webrtc/bin/server.js.
"""

import json
import asyncio
from typing import Dict, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Topic -> set of connected websockets
topics: Dict[str, Set[WebSocket]] = {}

# WebSocket -> set of subscribed topics (keyed by id(ws))
client_topics: Dict[int, Set[str]] = {}

# id(ws) -> WebSocket reference
clients: Dict[int, WebSocket] = {}

# === Yjs document sync relay ===
# Room name -> set of connected WebSockets for binary Yjs sync
sync_rooms: Dict[str, Set[WebSocket]] = {}


async def send_message(ws: WebSocket, message: dict) -> None:
    """Send a JSON message to a WebSocket client."""
    try:
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.send_text(json.dumps(message))
    except Exception:
        pass


def cleanup_client(ws_id: int) -> None:
    """Remove a client from all subscribed topics."""
    subscribed = client_topics.pop(ws_id, set())
    ws = clients.pop(ws_id, None)
    for topic_name in subscribed:
        subs = topics.get(topic_name)
        if subs and ws:
            subs.discard(ws)
            if len(subs) == 0:
                del topics[topic_name]


def handle_subscribe(ws: WebSocket, ws_id: int, topic_names: list) -> None:
    """Subscribe a client to one or more topics."""
    if ws_id not in client_topics:
        client_topics[ws_id] = set()
    for topic_name in topic_names:
        if isinstance(topic_name, str):
            if topic_name not in topics:
                topics[topic_name] = set()
            topics[topic_name].add(ws)
            client_topics[ws_id].add(topic_name)


def handle_unsubscribe(ws: WebSocket, ws_id: int, topic_names: list) -> None:
    """Unsubscribe a client from one or more topics."""
    for topic_name in topic_names:
        subs = topics.get(topic_name)
        if subs:
            subs.discard(ws)
            if len(subs) == 0:
                del topics[topic_name]
        if ws_id in client_topics:
            client_topics[ws_id].discard(topic_name)


async def handle_publish(ws: WebSocket, message: dict) -> None:
    """Relay a publish message to all subscribers of the topic."""
    topic_name = message.get("topic")
    if not topic_name:
        return
    receivers = topics.get(topic_name)
    if not receivers:
        return
    message["clients"] = len(receivers)
    tasks = []
    for receiver in list(receivers):
        tasks.append(send_message(receiver, message))
    if tasks:
        await asyncio.gather(*tasks)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "vigma-signaling",
        "topics": len(topics),
        "clients": len(clients),
    }


@app.websocket("/sync/{room_name}")
async def sync_endpoint(ws: WebSocket, room_name: str):
    """Binary WebSocket relay for Yjs document sync.

    Clients in the same room exchange Yjs sync protocol messages
    (sync step 1, sync step 2, updates, awareness) through this
    endpoint.  The server simply forwards every binary frame to
    all *other* clients in the room — it never inspects the
    payload.
    """
    await ws.accept()
    if room_name not in sync_rooms:
        sync_rooms[room_name] = set()
    sync_rooms[room_name].add(ws)

    try:
        while True:
            data = await ws.receive_bytes()
            # Relay to every other client in the room
            peers = sync_rooms.get(room_name, set())
            tasks = []
            for peer in list(peers):
                if peer is not ws:
                    try:
                        if peer.client_state == WebSocketState.CONNECTED:
                            tasks.append(peer.send_bytes(data))
                    except Exception:
                        pass
            if tasks:
                await asyncio.gather(*tasks)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if room_name in sync_rooms:
            sync_rooms[room_name].discard(ws)
            if len(sync_rooms[room_name]) == 0:
                del sync_rooms[room_name]


@app.websocket("/")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_id = id(ws)
    clients[ws_id] = ws
    client_topics[ws_id] = set()

    try:
        while True:
            data = await ws.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                continue

            if not message or not isinstance(message, dict):
                continue

            msg_type = message.get("type")
            if not msg_type:
                continue

            if msg_type == "subscribe":
                handle_subscribe(ws, ws_id, message.get("topics", []))
            elif msg_type == "unsubscribe":
                handle_unsubscribe(ws, ws_id, message.get("topics", []))
            elif msg_type == "publish":
                await handle_publish(ws, message)
            elif msg_type == "ping":
                await send_message(ws, {"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        cleanup_client(ws_id)
