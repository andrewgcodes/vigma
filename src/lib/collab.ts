'use client';

import { useCollabStore } from '@/store/collab-store';
import { canvasEngine } from '@/lib/canvas-engine';
import { useCanvasStore } from '@/store/canvas-store';

const WS_BASE = 'wss://app-taxlxzff.fly.dev';
const API_BASE = 'https://app-taxlxzff.fly.dev';

let ws: WebSocket | null = null;
let canvasSyncTimeout: ReturnType<typeof setTimeout> | null = null;
let cursorThrottleTimeout: ReturnType<typeof setTimeout> | null = null;
let isReceivingUpdate = false;

export function getIsReceivingUpdate(): boolean {
  return isReceivingUpdate;
}

export async function createRoom(): Promise<string> {
  const res = await fetch(`${API_BASE}/rooms`, { method: 'POST' });
  const data = await res.json();
  return data.room_id;
}

export function connectToRoom(roomId: string) {
  const store = useCollabStore.getState();

  // Don't reconnect if already connected to same room
  if (ws && ws.readyState === WebSocket.OPEN && store.roomId === roomId) {
    return;
  }

  // Close existing connection
  disconnectFromRoom();

  store.setRoomId(roomId);

  ws = new WebSocket(`${WS_BASE}/ws/${roomId}`);

  ws.onopen = () => {
    store.setIsConnected(true);
  };

  ws.onclose = () => {
    store.setIsConnected(false);
    // Auto-reconnect after 2 seconds
    if (store.roomId) {
      setTimeout(() => {
        if (store.roomId === roomId) {
          connectToRoom(roomId);
        }
      }, 2000);
    }
  };

  ws.onerror = () => {
    // Will trigger onclose
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch {
      // ignore malformed messages
    }
  };
}

export function disconnectFromRoom() {
  const store = useCollabStore.getState();
  if (ws) {
    ws.onclose = null; // prevent auto-reconnect
    ws.close();
    ws = null;
  }
  store.setIsConnected(false);
  store.setRoomId(null);
  store.setUserId(null);
  store.setUserName(null);
  store.setUserColor(null);
  store.setUsers([]);
  store.clearCursors();
}

function handleMessage(msg: Record<string, unknown>) {
  const store = useCollabStore.getState();
  const type = msg.type as string;

  switch (type) {
    case 'welcome':
      store.setUserId(msg.user_id as string);
      store.setUserName(msg.user_name as string);
      store.setUserColor(msg.user_color as string);
      store.setUsers(msg.users as { id: string; name: string; color: string }[]);
      // Send current canvas state to the room
      sendCanvasUpdate();
      break;

    case 'canvas_sync':
    case 'canvas_update': {
      const canvasJson = msg.canvas_json as string;
      if (canvasJson && canvasEngine.canvas) {
        isReceivingUpdate = true;
        const parsed = JSON.parse(canvasJson);
        canvasEngine.canvas.loadFromJSON(parsed).then(() => {
          canvasEngine.canvas?.requestRenderAll();
          const objects = canvasEngine.getObjectsList();
          useCanvasStore.getState().setObjects(objects);
          isReceivingUpdate = false;
        }).catch(() => {
          isReceivingUpdate = false;
        });
      }
      break;
    }

    case 'cursor_move':
      store.setCursor(msg.user_id as string, {
        userId: msg.user_id as string,
        userName: msg.user_name as string,
        color: msg.user_color as string,
        x: msg.x as number,
        y: msg.y as number,
        lastUpdate: Date.now(),
      });
      break;

    case 'user_joined':
    case 'user_renamed':
      store.setUsers(msg.users as { id: string; name: string; color: string }[]);
      break;

    case 'user_left':
      store.setUsers(msg.users as { id: string; name: string; color: string }[]);
      store.removeCursor(msg.user_id as string);
      break;
  }
}

export function sendCanvasUpdate() {
  if (!ws || ws.readyState !== WebSocket.OPEN || !canvasEngine.canvas) return;
  if (isReceivingUpdate) return;

  // Debounce canvas updates to avoid flooding
  if (canvasSyncTimeout) clearTimeout(canvasSyncTimeout);
  canvasSyncTimeout = setTimeout(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !canvasEngine.canvas) return;
    const json = JSON.stringify(
      (canvasEngine.canvas as unknown as { toJSON(props: string[]): object }).toJSON(['id', 'customType', 'customName'])
    );
    ws.send(JSON.stringify({
      type: 'canvas_update',
      canvas_json: json,
    }));
  }, 300);
}

export function sendCursorMove(x: number, y: number) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  // Throttle cursor updates to ~30fps
  if (cursorThrottleTimeout) return;
  cursorThrottleTimeout = setTimeout(() => {
    cursorThrottleTimeout = null;
  }, 33);

  ws.send(JSON.stringify({
    type: 'cursor_move',
    x,
    y,
  }));
}

export function sendNameChange(name: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  useCollabStore.getState().setUserName(name);
  ws.send(JSON.stringify({
    type: 'set_name',
    name,
  }));
}

export function isInRoom(): boolean {
  return useCollabStore.getState().roomId !== null;
}

export function getRoomShareUrl(roomId: string): string {
  // Use the current page URL with room parameter
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    return url.toString();
  }
  return `?room=${roomId}`;
}
