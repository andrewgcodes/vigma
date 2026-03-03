'use client';

import { create } from 'zustand';

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
}

interface CollabStore {
  // Connection state
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // Room state
  roomId: string | null;
  setRoomId: (id: string | null) => void;

  // Current user
  userId: string | null;
  setUserId: (id: string | null) => void;
  userName: string | null;
  setUserName: (name: string | null) => void;
  userColor: string | null;
  setUserColor: (color: string | null) => void;

  // Remote users
  users: CollabUser[];
  setUsers: (users: CollabUser[]) => void;

  // Remote cursors
  cursors: Record<string, RemoteCursor>;
  setCursor: (userId: string, cursor: RemoteCursor) => void;
  removeCursor: (userId: string) => void;
  clearCursors: () => void;

  // Share modal
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
}

export const useCollabStore = create<CollabStore>((set) => ({
  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),

  roomId: null,
  setRoomId: (id) => set({ roomId: id }),

  userId: null,
  setUserId: (id) => set({ userId: id }),
  userName: null,
  setUserName: (name) => set({ userName: name }),
  userColor: null,
  setUserColor: (color) => set({ userColor: color }),

  users: [],
  setUsers: (users) => set({ users }),

  cursors: {},
  setCursor: (userId, cursor) =>
    set((state) => ({
      cursors: { ...state.cursors, [userId]: cursor },
    })),
  removeCursor: (userId) =>
    set((state) => {
      const newCursors = { ...state.cursors };
      delete newCursors[userId];
      return { cursors: newCursors };
    }),
  clearCursors: () => set({ cursors: {} }),

  showShareModal: false,
  setShowShareModal: (show) => set({ showShareModal: show }),
}));
