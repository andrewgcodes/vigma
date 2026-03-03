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

export interface CanvasComment {
  id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  text: string;
  x: number;
  y: number;
  parent_id: string | null;
  created_at: string;
  resolved: boolean;
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

  // Comments
  comments: CanvasComment[];
  setComments: (comments: CanvasComment[]) => void;
  addComment: (comment: CanvasComment) => void;
  removeComment: (commentId: string, replyIds?: string[]) => void;
  resolveComment: (commentId: string, resolved: boolean) => void;
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  isCommentMode: boolean;
  setIsCommentMode: (mode: boolean) => void;
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

  comments: [],
  setComments: (comments) => set({ comments }),
  addComment: (comment) =>
    set((state) => ({ comments: [...state.comments, comment] })),
  removeComment: (commentId, replyIds) =>
    set((state) => {
      const idsToRemove = new Set([commentId, ...(replyIds || [])]);
      return { comments: state.comments.filter((c) => !idsToRemove.has(c.id)) };
    }),
  resolveComment: (commentId, resolved) =>
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId ? { ...c, resolved } : c
      ),
    })),
  activeCommentId: null,
  setActiveCommentId: (id) => set({ activeCommentId: id }),
  isCommentMode: false,
  setIsCommentMode: (mode) => set({ isCommentMode: mode }),
}));
