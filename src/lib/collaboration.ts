// Collaboration layer: Yjs + y-webrtc for real-time multiplayer sync
// Architecture:
// - Y.Map('objects') keyed by object ID -> serialized Fabric.js object JSON
// - Y.Map('comments') keyed by comment ID for concurrent-safe mutations
// - Awareness for live cursors and presence
// - y-webrtc for P2P sync via custom signaling server on Fly.io

import * as Y from 'yjs'
// @ts-ignore - y-webrtc doesn't have types
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import type { UserIdentity } from './userIdentity'

// Custom signaling server (WebSocket) used by y-webrtc
// Override with NEXT_PUBLIC_VIGMA_SIGNALING_SERVER at build time (Vercel env var)
const DEFAULT_SIGNALING_SERVER = 'wss://vigma-signaling.fly.dev'
const SIGNALING_SERVER = process.env.NEXT_PUBLIC_VIGMA_SIGNALING_SERVER || DEFAULT_SIGNALING_SERVER

function wsToHttp(url: string): string {
  if (url.startsWith('wss://')) return `https://${url.slice('wss://'.length)}`
  if (url.startsWith('ws://')) return `http://${url.slice('ws://'.length)}`
  return url
}

const SIGNALING_HTTP = process.env.NEXT_PUBLIC_VIGMA_SIGNALING_HTTP || wsToHttp(SIGNALING_SERVER)

/** Pre-warm the signaling server (wakes Fly.io from cold start) */
export function prewarmSignalingServer(): void {
  fetch(SIGNALING_HTTP, { mode: 'no-cors', cache: 'no-store' }).catch(() => {
    // Ignore errors — this is best-effort to wake up the server
  })
}

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
  commentsMap: Y.Map<any> // key: comment ID, value: comment data
  roomId: string
  user: UserIdentity
  private isApplyingRemote = false
  private isSyncingLocal = false
  private onRemoteObjectChange?: (changes: { added: string[], updated: string[], deleted: string[] }) => void
  private onRemoteCommentsChange?: () => void
  private onUsersChange?: (users: RemoteUser[]) => void
  private onConnectionStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
  private connected = false
  private _persistenceSynced = false
  private _suppressObserver = true // Suppress objectsMap observer until initial sync is done

  constructor(roomId: string, user: UserIdentity) {
    this.roomId = roomId
    this.user = user
    this.doc = new Y.Doc()
    this.objectsMap = this.doc.getMap('objects')
    this.commentsMap = this.doc.getMap('commentsV2')
  }

  connect(options?: {
    onRemoteObjectChange?: (changes: { added: string[], updated: string[], deleted: string[] }) => void
    onRemoteCommentsChange?: () => void
    onUsersChange?: (users: RemoteUser[]) => void
    onConnectionStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
  }) {
    if (this.connected) return

    this.onRemoteObjectChange = options?.onRemoteObjectChange
    this.onRemoteCommentsChange = options?.onRemoteCommentsChange
    this.onUsersChange = options?.onUsersChange
    this.onConnectionStatusChange = options?.onConnectionStatusChange

    this.onConnectionStatusChange?.('connecting')

    // Set up IndexedDB persistence for offline support
    this.persistence = new IndexeddbPersistence(`vigma-room-${this.roomId}`, this.doc)

    // Track when IndexedDB persistence has finished loading
    this.persistence.on('synced', () => {
      this._persistenceSynced = true
    })

    // Set up WebRTC provider for P2P sync using our custom signaling server
    this.provider = new WebrtcProvider(`vigma-${this.roomId}`, this.doc, {
      signaling: [
        SIGNALING_SERVER,
      ],
    })

    // Mark as connected once the provider is set up and signaling starts
    // (Don't wait for peers — a solo user should see 'connected' immediately)
    this.onConnectionStatusChange?.('connected')

    // Track WebRTC peer connections for user count updates
    this.provider.on('peers', () => {
      this.emitUsersChange()
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

    // Listen for remote object changes.
    // _suppressObserver is true during initial sync (startCollaboration)
    // to prevent the observer from racing with the JOINING path.
    this.objectsMap.observe((event) => {
      if (this.isSyncingLocal || this._suppressObserver) return

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
    this.commentsMap.observeDeep(() => {
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

  /** Push entire canvas state to Yjs (destructive — clears existing first).
   *  WARNING: Only use for full canvas replacement (e.g., page switch).
   *  Do NOT use for initial sync — use reconcileCanvasState() instead. */
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

  /** Reconcile local canvas state with Yjs (Bug 2 fix).
   *  Instead of destructively replacing all objects, this merges:
   *  - Local objects not in remote → added to Yjs
   *  - Remote objects not in local → returned so caller can add to canvas
   *  - Objects in both → remote version is kept (it was there first)
   *  This prevents race conditions during initial sync where WebRTC peers
   *  may deliver objects while IndexedDB is still loading. */
  reconcileCanvasState(localObjects: Array<{ id: string; json: string }>): { remoteOnlyIds: string[]; overlappingIds: string[] } {
    this.isSyncingLocal = true
    const remoteIds = new Set(Array.from(this.objectsMap.keys()))
    const localIds = new Set(localObjects.map(o => o.id))

    this.doc.transact(() => {
      // Add local objects that don't exist in remote
      for (const obj of localObjects) {
        if (!remoteIds.has(obj.id)) {
          this.objectsMap.set(obj.id, obj.json)
        }
        // If object exists in both, remote wins (they were there first)
      }
      // Do NOT delete remote objects that aren't in local
      // (they may have been added by other peers)
    })
    this.isSyncingLocal = false

    // Return IDs of remote objects not in local (caller needs to add to canvas)
    // and IDs of overlapping objects (caller needs to update canvas to match remote)
    const remoteOnlyIds: string[] = []
    const overlappingIds: string[] = []
    remoteIds.forEach(id => {
      if (!localIds.has(id)) {
        remoteOnlyIds.push(id)
      } else {
        overlappingIds.push(id)
      }
    })
    return { remoteOnlyIds, overlappingIds }
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
    this.commentsMap.set(comment.id, comment)
    this.isSyncingLocal = false
  }

  /** Add a reply to a comment */
  addReply(commentId: string, reply: CommentReply) {
    const commentData = this.commentsMap.get(commentId)
    if (!commentData) return

    this.isSyncingLocal = true
    this.commentsMap.set(commentId, {
      ...commentData,
      replies: [...(commentData.replies || []), reply],
    })
    this.isSyncingLocal = false
  }

  /** Delete a comment */
  deleteComment(commentId: string) {
    this.isSyncingLocal = true
    this.commentsMap.delete(commentId)
    this.isSyncingLocal = false
  }

  /** Delete a reply */
  deleteReply(commentId: string, replyId: string) {
    const commentData = this.commentsMap.get(commentId)
    if (!commentData) return

    this.isSyncingLocal = true
    this.commentsMap.set(commentId, {
      ...commentData,
      replies: (commentData.replies || []).filter((r: CommentReply) => r.id !== replyId),
    })
    this.isSyncingLocal = false
  }

  /** Toggle resolved state */
  toggleResolve(commentId: string) {
    const commentData = this.commentsMap.get(commentId)
    if (!commentData) return

    this.isSyncingLocal = true
    this.commentsMap.set(commentId, {
      ...commentData,
      resolved: !commentData.resolved,
    })
    this.isSyncingLocal = false
  }

  /** Get all comments */
  getComments(): Comment[] {
    const comments: Comment[] = []
    this.commentsMap.forEach((value) => {
      comments.push(value as Comment)
    })
    // Sort by timestamp so order is consistent
    comments.sort((a, b) => a.timestamp - b.timestamp)
    return comments
  }

  /** Get connection status */
  isConnected(): boolean {
    return this.connected
  }

  /** Check if IndexedDB persistence has finished loading */
  isPersistenceSynced(): boolean {
    return this._persistenceSynced
  }

  /** Get number of connected peers */
  getPeerCount(): number {
    if (!this.provider) return 0
    return this.provider.awareness.getStates().size - 1 // exclude self
  }

  /** Wait for either persistence sync or timeout */
  waitForSync(timeoutMs = 500): Promise<void> {
    return new Promise((resolve) => {
      if (this._persistenceSynced) {
        resolve()
        return
      }
      const timeout = setTimeout(() => resolve(), timeoutMs)
      if (this.persistence) {
        this.persistence.on('synced', () => {
          clearTimeout(timeout)
          resolve()
        })
      } else {
        clearTimeout(timeout)
        resolve()
      }
    })
  }

  /** Wait for objectsMap to receive content from peers (BroadcastChannel/WebRTC).
   *  Returns the number of objects found when content arrives or timeout expires.
   *  This is needed because BroadcastChannel sync takes longer than IndexedDB
   *  persistence — without this wait, a joining peer would see remoteObjectCount=0
   *  and incorrectly enter the CREATING path instead of the JOINING path. */
  waitForContent(timeoutMs = 1500): Promise<number> {
    return new Promise((resolve) => {
      // Already has content — resolve immediately
      if (this.objectsMap.size > 0) {
        resolve(this.objectsMap.size)
        return
      }
      const timeout = setTimeout(() => {
        this.objectsMap.unobserve(observer)
        resolve(this.objectsMap.size)
      }, timeoutMs)
      const observer = () => {
        if (this.objectsMap.size > 0) {
          clearTimeout(timeout)
          this.objectsMap.unobserve(observer)
          resolve(this.objectsMap.size)
        }
      }
      this.objectsMap.observe(observer)
    })
  }

  /** Enable the objectsMap observer for real-time remote object sync.
   *  Must be called after initial sync/load is complete (e.g., after
   *  startCollaboration finishes the JOINING or CREATING path).
   *  Until this is called, the observer is suppressed to prevent race
   *  conditions between the observer and the initial load logic. */
  enableRemoteObjectSync() {
    this._suppressObserver = false
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
