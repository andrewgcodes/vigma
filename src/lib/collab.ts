'use client';

import { useCollabStore, CanvasComment } from '@/store/collab-store';
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
  // Always read fresh state from the store
  const currentState = useCollabStore.getState();

  // Don't reconnect if already connected to same room
  if (ws && ws.readyState === WebSocket.OPEN && currentState.roomId === roomId) {
    return;
  }

  // Close existing connection
  disconnectFromRoom();

  useCollabStore.getState().setRoomId(roomId);

  ws = new WebSocket(`${WS_BASE}/ws/${roomId}`);

  ws.onopen = () => {
    useCollabStore.getState().setIsConnected(true);
  };

  ws.onclose = () => {
    useCollabStore.getState().setIsConnected(false);
    // Auto-reconnect after 2 seconds
    const currentRoomId = useCollabStore.getState().roomId;
    if (currentRoomId) {
      setTimeout(() => {
        if (useCollabStore.getState().roomId === roomId) {
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
      if (msg.comments) {
        store.setComments(msg.comments as CanvasComment[]);
      }
      // Only send canvas state if we're the first user in the room
      // (avoid overwriting existing room canvas when a second user joins)
      {
        const users = msg.users as { id: string; name: string; color: string }[];
        if (users.length <= 1) {
          sendCanvasUpdate();
        }
      }
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

    case 'comment_added':
      store.addComment(msg.comment as CanvasComment);
      break;

    case 'comment_deleted':
      store.removeComment(
        msg.comment_id as string,
        msg.deleted_reply_ids as string[] | undefined
      );
      break;

    case 'comment_resolved':
      store.resolveComment(
        msg.comment_id as string,
        msg.resolved as boolean
      );
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

export function sendComment(text: string, x: number, y: number, parentId?: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({
    type: 'add_comment',
    text,
    x,
    y,
    parent_id: parentId || null,
  }));
}

export function sendDeleteComment(commentId: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({
    type: 'delete_comment',
    comment_id: commentId,
  }));
}

export function sendResolveComment(commentId: string, resolved: boolean) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({
    type: 'resolve_comment',
    comment_id: commentId,
    resolved,
  }));
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
