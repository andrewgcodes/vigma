// Collaboration layer: Yjs + y-webrtc for real-time multiplayer sync
// Architecture:
// - Y.Map('objects') keyed by object ID -> serialized Fabric.js object JSON
// - Y.Array('comments') for comment threads
// - Awareness for live cursors and presence
// - y-webrtc for P2P sync (no server needed)

import * as Y from 'yjs'
// @ts-ignore - y-webrtc doesn't have types
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import type { UserIdentity } from './userIdentity'

export interface Comment {
  id: string
  text: string
  author: UserIdentity
  x: number
  y: number
  timestamp: number
  resolved: boolean
  replies: CommentReply[]
}

export interface CommentReply {
  id: string
  text: string
  author: UserIdentity
  timestamp: number
}

export interface RemoteUser {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number } | null
  selectedIds: string[]
}

export class CollaborationManager {
  doc: Y.Doc
  provider: WebrtcProvider | null = null
  persistence: IndexeddbPersistence | null = null
  objectsMap: Y.Map<string> // key: object ID, value: serialized JSON
  commentsArray: Y.Array<any>
  roomId: string
  user: UserIdentity
  private isApplyingRemote = false
  private isSyncingLocal = false
  private onRemoteObjectChange?: (changes: { added: string[], updated: string[], deleted: string[] }) => void
  private onRemoteCommentsChange?: () => void
  private onUsersChange?: (users: RemoteUser[]) => void
  private connected = false

  constructor(roomId: string, user: UserIdentity) {
    this.roomId = roomId
    this.user = user
    this.doc = new Y.Doc()
    this.objectsMap = this.doc.getMap('objects')
    this.commentsArray = this.doc.getArray('comments')
  }

  connect(options?: {
    onRemoteObjectChange?: (changes: { added: string[], updated: string[], deleted: string[] }) => void
    onRemoteCommentsChange?: () => void
    onUsersChange?: (users: RemoteUser[]) => void
  }) {
    if (this.connected) return

    this.onRemoteObjectChange = options?.onRemoteObjectChange
    this.onRemoteCommentsChange = options?.onRemoteCommentsChange
    this.onUsersChange = options?.onUsersChange

    // Set up IndexedDB persistence for offline support
    this.persistence = new IndexeddbPersistence(`vigma-room-${this.roomId}`, this.doc)

    // Set up WebRTC provider for P2P sync
    this.provider = new WebrtcProvider(`vigma-${this.roomId}`, this.doc, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com',
      ],
    })

    // Set awareness (presence) state
    this.provider.awareness.setLocalState({
      user: {
        id: this.user.id,
        name: this.user.name,
        color: this.user.color,
      },
      cursor: null,
      selectedIds: [],
    })

    // Listen for awareness changes (cursors, presence)
    this.provider.awareness.on('change', () => {
      this.emitUsersChange()
    })

    // Listen for remote object changes
    this.objectsMap.observe((event) => {
      if (this.isSyncingLocal) return

      const added: string[] = []
      const updated: string[] = []
      const deleted: string[] = []

      event.keysChanged.forEach((key) => {
        const change = event.changes.keys.get(key)
        if (!change) return
        switch (change.action) {
          case 'add':
            added.push(key)
            break
          case 'update':
            updated.push(key)
            break
          case 'delete':
            deleted.push(key)
            break
        }
      })

      if (added.length > 0 || updated.length > 0 || deleted.length > 0) {
        this.isApplyingRemote = true
        this.onRemoteObjectChange?.({ added, updated, deleted })
        this.isApplyingRemote = false
      }
    })

    // Listen for remote comment changes
    this.commentsArray.observeDeep(() => {
      if (this.isSyncingLocal) return
      this.onRemoteCommentsChange?.()
    })

    this.connected = true
  }

  disconnect() {
    if (this.provider) {
      this.provider.destroy()
      this.provider = null
    }
    if (this.persistence) {
      this.persistence.destroy()
      this.persistence = null
    }
    this.doc.destroy()
    this.connected = false
  }

  // === CANVAS OBJECT SYNC ===

  /** Check if currently applying remote changes (to avoid loops) */
  get isRemoteUpdate(): boolean {
    return this.isApplyingRemote
  }

  /** Sync a local object change to Yjs */
  syncObjectToYjs(objectId: string, serializedJson: string) {
    if (this.isApplyingRemote) return
    this.isSyncingLocal = true
    this.objectsMap.set(objectId, serializedJson)
    this.isSyncingLocal = false
  }

  /** Sync multiple object changes in a single transaction */
  syncObjectsToYjs(objects: Array<{ id: string; json: string }>) {
    if (this.isApplyingRemote) return
    this.isSyncingLocal = true
    this.doc.transact(() => {
      for (const obj of objects) {
        this.objectsMap.set(obj.id, obj.json)
      }
    })
    this.isSyncingLocal = false
  }

  /** Remove an object from Yjs */
  removeObjectFromYjs(objectId: string) {
    if (this.isApplyingRemote) return
    this.isSyncingLocal = true
    this.objectsMap.delete(objectId)
    this.isSyncingLocal = false
  }

  /** Remove multiple objects from Yjs */
  removeObjectsFromYjs(objectIds: string[]) {
    if (this.isApplyingRemote) return
    this.isSyncingLocal = true
    this.doc.transact(() => {
      for (const id of objectIds) {
        this.objectsMap.delete(id)
      }
    })
    this.isSyncingLocal = false
  }

  /** Get a serialized object from Yjs by ID */
  getObject(objectId: string): string | undefined {
    return this.objectsMap.get(objectId)
  }

  /** Get all objects from Yjs */
  getAllObjects(): Map<string, string> {
    const result = new Map<string, string>()
    this.objectsMap.forEach((value, key) => {
      result.set(key, value)
    })
    return result
  }

  /** Push entire canvas state to Yjs (for initial sync) */
  pushCanvasState(objects: Array<{ id: string; json: string }>) {
    this.isSyncingLocal = true
    this.doc.transact(() => {
      // Clear existing
      const existingKeys = Array.from(this.objectsMap.keys())
      for (const key of existingKeys) {
        this.objectsMap.delete(key)
      }
      // Add all current objects
      for (const obj of objects) {
        this.objectsMap.set(obj.id, obj.json)
      }
    })
    this.isSyncingLocal = false
  }

  // === CURSOR / PRESENCE ===

  /** Update local cursor position */
  updateCursor(x: number, y: number) {
    if (!this.provider) return
    const state = this.provider.awareness.getLocalState() || {}
    this.provider.awareness.setLocalState({
      ...state,
      cursor: { x, y },
    })
  }

  /** Clear local cursor (e.g., mouse leaves canvas) */
  clearCursor() {
    if (!this.provider) return
    const state = this.provider.awareness.getLocalState() || {}
    this.provider.awareness.setLocalState({
      ...state,
      cursor: null,
    })
  }

  /** Update local selection state */
  updateSelection(selectedIds: string[]) {
    if (!this.provider) return
    const state = this.provider.awareness.getLocalState() || {}
    this.provider.awareness.setLocalState({
      ...state,
      selectedIds,
    })
  }

  /** Get all remote users */
  getRemoteUsers(): RemoteUser[] {
    if (!this.provider) return []
    const users: RemoteUser[] = []
    const states = this.provider.awareness.getStates()
    const localClientId = this.provider.awareness.clientID

    states.forEach((state, clientId) => {
      if (clientId === localClientId) return
      if (!state.user) return
      users.push({
        id: state.user.id,
        name: state.user.name,
        color: state.user.color,
        cursor: state.cursor || null,
        selectedIds: state.selectedIds || [],
      })
    })

    return users
  }

  private emitUsersChange() {
    const users = this.getRemoteUsers()
    this.onUsersChange?.(users)
  }

  // === COMMENTS ===

  /** Add a new comment */
  addComment(comment: Comment) {
    this.isSyncingLocal = true
    this.commentsArray.push([comment])
    this.isSyncingLocal = false
  }

  /** Add a reply to a comment */
  addReply(commentId: string, reply: CommentReply) {
    const comments = this.getComments()
    const idx = comments.findIndex(c => c.id === commentId)
    if (idx === -1) return

    this.isSyncingLocal = true
    this.doc.transact(() => {
      const commentData = this.commentsArray.get(idx)
      const updatedComment = {
        ...commentData,
        replies: [...(commentData.replies || []), reply],
      }
      this.commentsArray.delete(idx, 1)
      this.commentsArray.insert(idx, [updatedComment])
    })
    this.isSyncingLocal = false
  }

  /** Delete a comment */
  deleteComment(commentId: string) {
    const comments = this.getComments()
    const idx = comments.findIndex(c => c.id === commentId)
    if (idx === -1) return

    this.isSyncingLocal = true
    this.commentsArray.delete(idx, 1)
    this.isSyncingLocal = false
  }

  /** Delete a reply */
  deleteReply(commentId: string, replyId: string) {
    const comments = this.getComments()
    const idx = comments.findIndex(c => c.id === commentId)
    if (idx === -1) return

    const comment = comments[idx]
    const updatedReplies = comment.replies.filter((r: CommentReply) => r.id !== replyId)

    this.isSyncingLocal = true
    this.doc.transact(() => {
      const commentData = this.commentsArray.get(idx)
      const updatedComment = { ...commentData, replies: updatedReplies }
      this.commentsArray.delete(idx, 1)
      this.commentsArray.insert(idx, [updatedComment])
    })
    this.isSyncingLocal = false
  }

  /** Toggle resolved state */
  toggleResolve(commentId: string) {
    const comments = this.getComments()
    const idx = comments.findIndex(c => c.id === commentId)
    if (idx === -1) return

    this.isSyncingLocal = true
    this.doc.transact(() => {
      const commentData = this.commentsArray.get(idx)
      const updatedComment = { ...commentData, resolved: !commentData.resolved }
      this.commentsArray.delete(idx, 1)
      this.commentsArray.insert(idx, [updatedComment])
    })
    this.isSyncingLocal = false
  }

  /** Get all comments */
  getComments(): Comment[] {
    return this.commentsArray.toArray() as Comment[]
  }

  /** Get connection status */
  isConnected(): boolean {
    return this.connected
  }

  /** Get number of connected peers */
  getPeerCount(): number {
    if (!this.provider) return 0
    return this.provider.awareness.getStates().size - 1 // exclude self
  }
}

// === ROOM ID UTILITIES ===

/** Generate a new room ID */
export function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const segments = [4, 4, 4]
  return segments.map(len => {
    let s = ''
    for (let i = 0; i < len; i++) {
      s += chars[Math.floor(Math.random() * chars.length)]
    }
    return s
  }).join('-')
}

/** Get room ID from URL hash */
export function getRoomIdFromHash(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  const match = hash.match(/^#room=(.+)$/)
  return match ? match[1] : null
}

/** Set room ID in URL hash */
export function setRoomIdInHash(roomId: string) {
  if (typeof window === 'undefined') return
  window.location.hash = `room=${roomId}`
}

/** Clear room from URL hash */
export function clearRoomFromHash() {
  if (typeof window === 'undefined') return
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
