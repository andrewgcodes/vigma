'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { CanvasEngine } from '@/lib/canvasEngine'
import { useDesignStore } from '@/store/useDesignStore'
import Toolbar from '@/components/Toolbar'
import TopBar from '@/components/TopBar'
import LayersPanel from '@/components/LayersPanel'
import PagesPanel from '@/components/PagesPanel'
import PropertiesPanel from '@/components/PropertiesPanel'
import ContextMenu from '@/components/ContextMenu'
import Rulers from '@/components/Rulers'
import CursorOverlay from '@/components/CursorOverlay'
import CommentPins from '@/components/CommentPins'
import CommentsPanel from '@/components/CommentsPanel'
import { CollaborationManager, generateRoomId, getRoomIdFromHash, setRoomIdInHash, clearRoomFromHash, prewarmSignalingServer } from '@/lib/collaboration'
import { prepareObjectJsonForSync, needsCompressionForSync } from '@/lib/imageSync'
import { persistGet, persistSet, persistRemove } from '@/lib/persistence'
import type { Comment, CommentReply, RemoteUser } from '@/lib/collaboration'
import { getUserIdentity } from '@/lib/userIdentity'
import type { UserIdentity } from '@/lib/userIdentity'
import { v4 as uuidv4 } from 'uuid'
import type { ToolType } from '@/types/design'
import WelcomeModal from '@/components/WelcomeModal'
import MobileGate from '@/components/MobileGate'
import KeyboardShortcutsDialog from '@/components/KeyboardShortcutsDialog'
import StatusBar from '@/components/StatusBar'
import ToastNotification from '@/components/ToastNotification'
import MiniMap from '@/components/MiniMap'
import ObjectInfoOverlay from '@/components/ObjectInfoOverlay'
import GridSettingsPanel from '@/components/GridSettingsPanel'
import ExportSettingsDialog from '@/components/ExportSettingsDialog'
import CanvasBackgroundPicker from '@/components/CanvasBackgroundPicker'
import SelectionInfoBadge from '@/components/SelectionInfoBadge'
import BulkOperationsBar from '@/components/BulkOperationsBar'
import WorkspaceInfo from '@/components/WorkspaceInfo'
import ViewMenu from '@/components/ViewMenu'
import SearchLayers from '@/components/SearchLayers'
import FeatureHub from '@/components/FeatureHub'

/** Property list used when serializing Fabric.js objects for Yjs sync. */
const SYNC_PROPS = ['id', 'name', 'isFrame', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls', 'selectable', 'evented']

export default function DesignPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CanvasEngine | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    activeTool, setActiveTool,
    selectedIds, setSelectedIds,
    fill, setFill,
    stroke, setStroke,
    brushSettings,
    pages, currentPageId, setCurrentPageId, addPage, removePage, updatePage,
    leftPanelOpen, toggleLeftPanel,
    rightPanelOpen, toggleRightPanel,
    leftPanelTab, setLeftPanelTab,
    leftPanelWidth, setLeftPanelWidth,
    rightPanelWidth, setRightPanelWidth,
    showGrid, toggleGrid,
    showRulers, toggleRulers,
    snapToGrid, toggleSnapToGrid,
    gridSize,
    viewport, setViewport,
    showKeyboardShortcuts, setShowKeyboardShortcuts,
    showMinimap,
    showObjectInfo,
    showStatusBar,
    showWorkspaceInfo, toggleWorkspaceInfo,
    showSelectionDimensions,
    darkMode,
    canvasBackground, setCanvasBackground,
    setCursorPosition,
    layerSearchQuery, setLayerSearchQuery,
    showToast,
    autoSaveEnabled,
    addRecentColor,
    keyboardShortcutsEnabled,
  } = useDesignStore()

  const [layers, setLayers] = useState<any[]>([])
  const [objectProps, setObjectProps] = useState<Record<string, any> | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, hasSelection: false, multipleSelected: false, isLocked: false })
  const [isDrawingShape, setIsDrawingShape] = useState(false)
  // New feature state
  const [showGridSettings, setShowGridSettings] = useState(false)
  const [showExportSettings, setShowExportSettings] = useState(false)
  const [showCanvasBgPicker, setShowCanvasBgPicker] = useState(false)
  const [showViewMenuState, setShowViewMenuState] = useState(false)
  const [objectInfoPos, setObjectInfoPos] = useState({ x: 0, y: 0 })
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'just-saved'>('saved')
  const [largeImageWarning, setLargeImageWarning] = useState<string | null>(null)
  const largeImageWarningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [peerDisconnectNotice, setPeerDisconnectNotice] = useState<string | null>(null)
  const peerDisconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevRemoteUsersCountRef = useRef<number>(0)
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const drawStartRef = useRef<{ x: number; y: number } | null>(null)
  const previewObjRef = useRef<any>(null)
  const resizingRef = useRef<{ side: 'left' | 'right'; startX: number; startWidth: number } | null>(null)

  // Collaboration state
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showResolved, setShowResolved] = useState(false)
  const [commentInput, setCommentInput] = useState<{ x: number; y: number; text: string } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [showShareWarning, setShowShareWarning] = useState(false)
  const [shareModalStep, setShareModalStep] = useState<'warning' | 'link'>('warning')
  const [shareLink, setShareLink] = useState('')
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const collabRef = useRef<CollaborationManager | null>(null)
  const userRef = useRef<UserIdentity>(getUserIdentity())
  // Mutable ref to track current room ID for hashchange comparisons
  // (avoids stale closure issues with the roomId state variable)
  const roomIdRef = useRef<string | null>(null)
  // Track which object IDs are currently being applied from remote peers.
  // Using a Map<string, number> for reference counting prevents race conditions
  // both when async enlivenObjects interleaves with sync paths (Bug 1) AND when
  // the same object ID appears in multiple concurrent remote batches (the count
  // ensures the guard stays up until ALL batches processing that ID have completed).
  const remoteObjectIdsRef = useRef<Map<string, number>>(new Map())
  // Guard to prevent auto-save from persisting the empty canvas during
  // the gap between clearCanvas() and loadFromJSON() completing when
  // leaving a room or switching rooms via URL hash change.
  const isReloadingSoloRef = useRef(false)

  // Panel resize handlers
  const handleResizeStart = useCallback((side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault()
    const startWidth = side === 'left' ? leftPanelWidth : rightPanelWidth
    resizingRef.current = { side, startX: e.clientX, startWidth }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const delta = ev.clientX - resizingRef.current.startX
      if (resizingRef.current.side === 'left') {
        setLeftPanelWidth(resizingRef.current.startWidth + delta)
      } else {
        setRightPanelWidth(resizingRef.current.startWidth - delta)
      }
    }
    const handleMouseUp = () => {
      resizingRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [leftPanelWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth])

  // Initialize canvas engine
  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new CanvasEngine(canvasRef.current, {
      onSelectionChange: (ids) => {
        setSelectedIds(ids)
        refreshObjectProps()
        // Bug fix: update object info overlay position on selection change
        const active = engine.canvas.getActiveObject()
        if (active) {
          const bound = active.getBoundingRect()
          setObjectInfoPos({ x: bound.left, y: bound.top })
        }
      },
      onObjectModified: () => {
        refreshLayers()
        refreshObjectProps()
        // Bug fix: update object info overlay position on object modification
        const active = engine.canvas.getActiveObject()
        if (active) {
          const bound = active.getBoundingRect()
          setObjectInfoPos({ x: bound.left, y: bound.top })
        }
      },
      onHistoryChange: (undo, redo) => {
        setCanUndo(undo)
        setCanRedo(redo)
      },
      onZoomChange: (z) => {
        setZoom(z)
        setViewport({ zoom: z })
      },
      onViewportChange: (z, px, py) => {
        setZoom(z)
        setViewport({ zoom: z, panX: px, panY: py })
      },
    })

    engineRef.current = engine
    refreshLayers()

    // Handle resize
    const handleResize = () => {
      engine.resize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

      // Load saved project from localStorage (supports multi-page persistence)
      // Skip loading if we're about to join a collaboration room — the room
      // will provide all objects via Yjs. Loading stale localStorage data here
      // would cause old room objects to bleed into the new room.
      const loadSaved = async () => {
        if (getRoomIdFromHash()) return // joining a room — skip localStorage load

        // Helper: attempt to load canvas JSON with retry.
        // Fabric.js can throw "Cannot read properties of undefined (reading 'clearRect')"
        // if the canvas element isn't fully ready on the first attempt.
        const tryLoadJSON = async (json: string, retries = 2): Promise<boolean> => {
          for (let attempt = 0; attempt <= retries; attempt++) {
            try {
              await engine.loadFromJSON(json)
              return true
            } catch (loadErr) {
              // SyntaxError means genuinely corrupt JSON — re-throw so the
              // outer catch can clear localStorage. No point retrying.
              if (loadErr instanceof SyntaxError) throw loadErr
              console.warn(`loadFromJSON attempt ${attempt + 1} failed:`, loadErr)
              if (attempt < retries) {
                // Wait briefly for the canvas to finish initializing
                await new Promise(r => setTimeout(r, 100))
              }
            }
          }
          return false
        }

        try {
          // Read from IndexedDB (large-data-safe), with automatic fallback
          // to localStorage for projects saved before the IndexedDB migration.
          const savedPages = await persistGet('vigma-pages')
          if (savedPages) {
            const parsed = JSON.parse(savedPages)
            if (parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
              // Restore all pages into the store
              // Clear existing pages and load saved ones
              const store = useDesignStore.getState()
              // Remove default pages
              for (const p of store.pages) {
                if (!parsed.pages.find((sp: any) => sp.id === p.id)) {
                  store.removePage(p.id)
                }
              }
              // Add/update saved pages
              for (const savedPage of parsed.pages) {
                const existing = store.pages.find(p => p.id === savedPage.id)
                if (existing) {
                  store.updatePage(savedPage.id, { name: savedPage.name, canvasJSON: savedPage.canvasJSON })
                } else {
                  store.addPage(savedPage)
                }
              }
              // Remove any default pages that weren't in the saved data
              const savedIds = new Set(parsed.pages.map((p: any) => p.id))
              for (const p of useDesignStore.getState().pages) {
                if (!savedIds.has(p.id)) {
                  // Only remove if there will still be pages left
                  if (useDesignStore.getState().pages.length > 1) {
                    store.removePage(p.id)
                  }
                }
              }
              // Set the current page
              const targetPageId = parsed.currentPageId || parsed.pages[0].id
              store.setCurrentPageId(targetPageId)
              // Load the current page's canvas
              const currentPage = parsed.pages.find((p: any) => p.id === targetPageId)
              if (currentPage && currentPage.canvasJSON) {
                await tryLoadJSON(currentPage.canvasJSON)
              }
              // Restore viewport (zoom/pan) from saved state
              if (parsed.viewport) {
                const { zoom: savedZoom, panX, panY } = parsed.viewport
                if (savedZoom && savedZoom > 0) {
                  engine.canvas.setViewportTransform([savedZoom, 0, 0, savedZoom, panX || 0, panY || 0])
                  engine.canvas.renderAll()
                  setZoom(savedZoom)
                  setViewport({ zoom: savedZoom, panX: panX || 0, panY: panY || 0 })
                }
              }
              refreshLayers()
              return
            }
          }
          // Fallback: try loading legacy single-page format
          const saved = await persistGet('vigma-project')
          if (saved) {
            await tryLoadJSON(saved)
            refreshLayers()
          }
        } catch (e) {
          // Only clear storage for genuine data corruption (JSON parse errors).
          // Do NOT clear for transient canvas errors (e.g. clearRect) — the saved
          // data is still valid and will load fine on the next page load.
          if (e instanceof SyntaxError) {
            console.warn('Saved project data is corrupt, clearing storage', e)
            persistRemove('vigma-pages')
            persistRemove('vigma-project')
          } else {
            console.warn('Failed to load saved project (data preserved in storage)', e)
          }
        }
      }
      loadSaved()

    return () => {
      window.removeEventListener('resize', handleResize)
      engine.dispose()
    }
  }, [])

  // Refresh helpers
  const refreshLayers = useCallback(() => {
    if (engineRef.current) {
      setLayers(engineRef.current.getObjectsList())
    }
  }, [])

  const refreshObjectProps = useCallback(() => {
    if (engineRef.current) {
      setObjectProps(engineRef.current.getActiveObjectProps())
    }
  }, [])

  // === COLLABORATION ===

  // Sync a single canvas object to Yjs
  const syncObjectToCollab = useCallback((obj: any) => {
    const collab = collabRef.current
    if (!collab) return
    if (!obj || !obj.id) return
    // Skip if this object is currently being applied from a remote peer
    if ((remoteObjectIdsRef.current.get(obj.id) ?? 0) > 0) return
    try {
      const objJson = obj.toJSON(SYNC_PROPS)
      // For images with large base64 src, compress asynchronously before syncing
      // to avoid exceeding the WebRTC data channel ~256KB message size limit.
      if (needsCompressionForSync(obj)) {
        prepareObjectJsonForSync(objJson).then((json) => {
          // Re-check collab is still active and object isn't being updated by remote peer
          if (collabRef.current && !((remoteObjectIdsRef.current.get(obj.id) ?? 0) > 0)) {
            collabRef.current.syncObjectToYjs(obj.id, json)
          }
        }).catch((e) => {
          console.warn('Failed to compress image for sync', e)
        })
      } else {
        const json = JSON.stringify(objJson)
        collab.syncObjectToYjs(obj.id, json)
      }
    } catch (e) {
      console.warn('Failed to sync object to collab', e)
    }
  }, [])

  // Sync all canvas objects to Yjs (compresses large images asynchronously)
  const syncAllObjectsToCollab = useCallback(async () => {
    const collab = collabRef.current
    const engine = engineRef.current
    if (!collab || !engine || remoteObjectIdsRef.current.size > 0) return  // Map.size > 0 means some IDs still being processed
    const objects = engine.canvas.getObjects().filter((o: any) => !o.isPreview && !o.isGrid)
    const items = await Promise.all(objects.map(async (obj: any) => {
      if (!obj.id) obj.id = uuidv4()
      const objJson = obj.toJSON(SYNC_PROPS)
      const json = needsCompressionForSync(obj)
        ? await prepareObjectJsonForSync(objJson)
        : JSON.stringify(objJson)
      return { id: obj.id, json }
    }))
    // Re-check collab is still active after async compression
    if (collabRef.current) {
      collabRef.current.pushCanvasState(items)
    }
  }, [])

  /** Sync all currently-selected canvas objects to Yjs (for property panel changes).
   *  Fabric.js `object:modified` only fires for interactive transforms (drag/resize/rotate),
   *  NOT for programmatic `.set(...)` calls from the properties panel. */
  const syncActiveToCollab = useCallback(() => {
    const engine = engineRef.current
    const collab = collabRef.current
    if (!engine || !collab) return
    const active = engine.canvas.getActiveObject()
    if (!active) return
    if ((active as any).type === 'activeselection') {
      const objects = (active as any).getObjects()
      for (const obj of objects) {
        syncObjectToCollab(obj)
      }
    } else {
      syncObjectToCollab(active)
    }
  }, [syncObjectToCollab])

  // Handle remote object changes from Yjs
  const handleRemoteObjectChange = useCallback((changes: { added: string[], updated: string[], deleted: string[] }) => {
    const engine = engineRef.current
    const collab = collabRef.current
    if (!engine || !collab) return

    // Track ALL object IDs being processed in this batch (Bug 1 fix).
    // Using per-object ID tracking instead of a global counter prevents
    // race conditions when async enlivenObjects interleaves with sync paths.
    const processingIds = new Set<string>([
      ...changes.deleted,
      ...changes.added,
      ...changes.updated,
    ])
    for (const id of processingIds) {
      remoteObjectIdsRef.current.set(id, (remoteObjectIdsRef.current.get(id) ?? 0) + 1)
    }

    // Handle deletions
    for (const id of changes.deleted) {
      const obj = engine.canvas.getObjects().find((o: any) => o.id === id)
      if (obj) {
        engine.canvas.remove(obj)
      }
    }

    // Handle additions and updates
    const toProcess = [...changes.added, ...changes.updated]
    const enlivenPromises: Promise<void>[] = []
    for (const id of toProcess) {
      const jsonStr = collab.getObject(id)
      if (!jsonStr) continue
      try {
        const objData = JSON.parse(jsonStr)
        const existing = engine.canvas.getObjects().find((o: any) => o.id === id)
        if (existing) {
          // For Image objects, .set() won't reload the src — we must replace
          // the object entirely via enlivenObjects so the bitmap is rebuilt.
          const isImage = (typeof objData.type === 'string' && objData.type.toLowerCase() === 'image') && objData.src
          if (isImage) {
            const fabric = require('fabric')
            const promise = fabric.util.enlivenObjects([objData]).then((objs: any[]) => {
              if (objs[0]) {
                objs[0].id = id
                // Preserve z-index: insert at the same position
                const idx = engine.canvas.getObjects().indexOf(existing)
                engine.canvas.remove(existing)
                if (idx >= 0) {
                  engine.canvas.insertAt(idx, objs[0])
                } else {
                  engine.canvas.add(objs[0])
                }
                engine.canvas.renderAll()
                refreshLayers()
              }
            })
            enlivenPromises.push(promise)
          } else {
            // Update existing non-image object in-place
            existing.set(objData)
            existing.setCoords()
          }
        } else {
          // Add new object - use fabric.util.enlivenObjects
          const fabric = require('fabric')
          const promise = fabric.util.enlivenObjects([objData]).then((objs: any[]) => {
            if (objs[0]) {
              objs[0].id = id
              engine.canvas.add(objs[0])
              engine.canvas.renderAll()
              refreshLayers()
            }
          })
          enlivenPromises.push(promise)
        }
      } catch (e) {
        console.warn('Failed to process remote object', id, e)
      }
    }

    engine.canvas.renderAll()
    refreshLayers()

    // Clean up tracked IDs only after ALL async operations complete
    if (enlivenPromises.length > 0) {
      Promise.allSettled(enlivenPromises).then((results) => {
        for (const r of results) {
          if (r.status === 'rejected') {
            console.warn('Failed to enliven remote object', r.reason)
          }
        }
      }).finally(() => {
        for (const id of processingIds) {
          const count = (remoteObjectIdsRef.current.get(id) ?? 1) - 1
          if (count <= 0) {
            remoteObjectIdsRef.current.delete(id)
          } else {
            remoteObjectIdsRef.current.set(id, count)
          }
        }
      })
    } else {
      // All synchronous — use queueMicrotask to ensure event handlers
      // (like object:removed) have fired before we remove the guard
      queueMicrotask(() => {
        for (const id of processingIds) {
          const count = (remoteObjectIdsRef.current.get(id) ?? 1) - 1
          if (count <= 0) {
            remoteObjectIdsRef.current.delete(id)
          } else {
            remoteObjectIdsRef.current.set(id, count)
          }
        }
      })
    }
  }, [])

  // Initialize collaboration from URL hash
  useEffect(() => {
    const hashRoomId = getRoomIdFromHash()
    if (hashRoomId) {
      startCollaboration(hashRoomId)
    }

    const handleHashChange = () => {
      const newRoomId = getRoomIdFromHash()
      if (newRoomId && newRoomId !== roomIdRef.current) {
        // Switching rooms or joining a new one — disconnect old room first
        if (collabRef.current) {
          collabRef.current.disconnect()
          collabRef.current = null
          // Clear canvas so old room objects don't bleed into the new room
          if (engineRef.current) {
            engineRef.current.clearCanvas()
          }
        }
        startCollaboration(newRoomId)
      } else if (!newRoomId && collabRef.current) {
        // Hash cleared (left room via URL) — disconnect and reload solo project
        collabRef.current.disconnect()
        collabRef.current = null
        setIsCollaborating(false)
        setRoomId(null)
        roomIdRef.current = null
        setRemoteUsers([])
        setComments([])
        setConnectionStatus('disconnected')
        if (engineRef.current) {
          isReloadingSoloRef.current = true
          engineRef.current.clearCanvas()
          // Reload solo project from IndexedDB (falls back to localStorage)
          const engine = engineRef.current
          persistGet('vigma-pages').then((savedPages) => {
            if (savedPages) {
              try {
                const parsed = JSON.parse(savedPages)
                if (parsed.pages?.length > 0) {
                  const currentPage = parsed.pages.find((p: any) => p.id === parsed.currentPageId) || parsed.pages[0]
                  if (currentPage?.canvasJSON) {
                    engine.loadFromJSON(currentPage.canvasJSON).then(() => {
                      isReloadingSoloRef.current = false
                      refreshLayers()
                    }).catch(() => {
                      isReloadingSoloRef.current = false
                    })
                  } else {
                    isReloadingSoloRef.current = false
                  }
                } else {
                  isReloadingSoloRef.current = false
                }
              } catch (e) {
                isReloadingSoloRef.current = false
              }
            } else {
              isReloadingSoloRef.current = false
            }
          }).catch(() => {
            isReloadingSoloRef.current = false
          })
        }
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      if (collabRef.current) {
        collabRef.current.disconnect()
        collabRef.current = null
      }
    }
  }, [])

  // Start collaboration session
  const startCollaboration = useCallback(async (rid: string) => {
    if (collabRef.current) return

    const collab = new CollaborationManager(rid, userRef.current)
    collabRef.current = collab

    collab.connect({
      onRemoteObjectChange: handleRemoteObjectChange,
      onRemoteCommentsChange: () => {
        if (collabRef.current) {
          setComments(collabRef.current.getComments())
        }
      },
      onUsersChange: (users) => {
        const prevCount = prevRemoteUsersCountRef.current
        const newCount = users.length
        // Detect peer disconnection: count dropped and we previously had peers
        if (prevCount > 0 && newCount < prevCount) {
          const dropped = prevCount - newCount
          const msg = dropped === 1
            ? 'A collaborator has disconnected.'
            : `${dropped} collaborators have disconnected.`
          setPeerDisconnectNotice(msg)
          if (peerDisconnectTimerRef.current) clearTimeout(peerDisconnectTimerRef.current)
          peerDisconnectTimerRef.current = setTimeout(() => setPeerDisconnectNotice(null), 6000)
        }
        prevRemoteUsersCountRef.current = newCount
        setRemoteUsers(users)
      },
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status)
      },
    })

    setRoomId(rid)
    roomIdRef.current = rid
    setIsCollaborating(true)
    // Don't set 'connecting' here — collab.connect() already fires
    // onConnectionStatusChange('connected') synchronously, and React 18
    // batches setState calls so the last one wins.

    // Wait for persistence sync or peer data arrival (timeout after 2s).
    // The longer timeout gives WebRTC peers time to connect and sync Y.Doc
    // data — the old 500ms was too short for signaling + ICE + sync to complete,
    // causing joiners to see an empty canvas.
    await collab.waitForSync(2000)

    // Guard: if user left the room or component unmounted during sync, bail out
    if (collabRef.current !== collab) return

    // Check if the room already has objects (i.e., we're joining an existing room)
    // vs creating a new room (where we want to push our local canvas objects).
    const engine = engineRef.current
    if (engine) {
      const remoteObjectCount = collab.getAllObjects().size

      if (remoteObjectCount > 0) {
        // JOINING an existing room — clear any stale local objects first,
        // then pull all remote objects onto the canvas.
        // This prevents old localStorage/previous-room data from bleeding in.
        const canvasObjects = engine.canvas.getObjects().filter((o: any) => !o.isPreview && !o.isGrid)
        for (const obj of canvasObjects) {
          engine.canvas.remove(obj)
        }
        engine.canvas.renderAll()

        const allRemoteIds = Array.from(collab.getAllObjects().keys())
        // Filter out IDs already being processed by a concurrent handleRemoteObjectChange
        const safeRemoteIds = allRemoteIds.filter(id => (remoteObjectIdsRef.current.get(id) ?? 0) === 0)
        if (safeRemoteIds.length > 0) {
          handleRemoteObjectChange({
            added: safeRemoteIds,
            updated: [],
            deleted: [],
          })
        }
      } else {
        // CREATING a new room (empty Yjs doc) — push local canvas objects to Yjs.
        // This is the "Share" flow where the user has a design and wants to collaborate.
        const localObjects = await Promise.all(engine.canvas.getObjects()
          .filter((o: any) => !o.isPreview && !o.isGrid)
          .map(async (obj: any) => {
            if (!obj.id) obj.id = uuidv4()
            const objJson = obj.toJSON(SYNC_PROPS)
            const json = needsCompressionForSync(obj)
              ? await prepareObjectJsonForSync(objJson)
              : JSON.stringify(objJson)
            return { id: obj.id, json }
          }))

        // Re-check collab is still active after async compression
        if (collabRef.current !== collab) return

        if (localObjects.length > 0) {
          const { remoteOnlyIds, overlappingIds } = collab.reconcileCanvasState(localObjects)
          const safeRemoteOnlyIds = remoteOnlyIds.filter(id => (remoteObjectIdsRef.current.get(id) ?? 0) === 0)
          const safeOverlappingIds = overlappingIds.filter(id => (remoteObjectIdsRef.current.get(id) ?? 0) === 0)
          if (safeRemoteOnlyIds.length > 0 || safeOverlappingIds.length > 0) {
            handleRemoteObjectChange({
              added: safeRemoteOnlyIds,
              updated: safeOverlappingIds,
              deleted: [],
            })
          }
        }
      }
    }
    setComments(collab.getComments())
  }, [handleRemoteObjectChange])

  // Canvas event listeners for collaboration sync
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !isCollaborating) return

    const onModified = (opt: any) => {
      const target = opt.target
      if (!target) return
      if ((target as any).type === 'activeselection') {
        const objects = (target as any).getObjects()
        for (const obj of objects) {
              // Per-object remote check (Bug 1 fix)
              if (!((remoteObjectIdsRef.current.get(obj.id) ?? 0) > 0)) {
            syncObjectToCollab(obj)
          }
        }
      } else {
        if (target.id && (remoteObjectIdsRef.current.get(target.id) ?? 0) > 0) return
        syncObjectToCollab(target)
      }
    }

    const onAdded = (opt: any) => {
      const target = opt.target
      if (!target || (target as any).isPreview || (target as any).isGrid) return
      if (!target.id) target.id = uuidv4()
      // Check if THIS specific object is being applied from remote (Bug 1 fix)
      if ((remoteObjectIdsRef.current.get(target.id) ?? 0) > 0) return
      syncObjectToCollab(target)
    }

    const onRemoved = (opt: any) => {
      const target = opt.target
      if (!target || !target.id || (target as any).isPreview || (target as any).isGrid) return
      // Check if THIS specific object is being removed from remote (Bug 1 fix)
      if ((remoteObjectIdsRef.current.get(target.id) ?? 0) > 0) return
      collabRef.current?.removeObjectFromYjs(target.id)
    }

    // NOTE: path:created handler removed (Bug 3 fix).
    // Fabric.js fires BOTH path:created AND object:added for freehand paths.
    // The onAdded handler above already syncs the path to Yjs, so having
    // a path:created handler caused double-sync of the same object.

    // Sync text content when user finishes editing (Fabric.js text editing
    // does NOT fire object:modified for content changes — only for
    // move/resize/rotate transforms)
    const onTextEditingExited = (opt: any) => {
      const target = opt.target
      if (!target) return
      if (target.id && (remoteObjectIdsRef.current.get(target.id) ?? 0) > 0) return
      syncObjectToCollab(target)
    }

    // Also sync on every keystroke so collaborators see live typing
    const onTextChanged = (opt: any) => {
      const target = opt.target
      if (!target) return
      if (target.id && (remoteObjectIdsRef.current.get(target.id) ?? 0) > 0) return
      syncObjectToCollab(target)
    }

    engine.canvas.on('object:modified', onModified)
    engine.canvas.on('object:added', onAdded)
    engine.canvas.on('object:removed', onRemoved)
    engine.canvas.on('text:editing:exited', onTextEditingExited)
    engine.canvas.on('text:changed', onTextChanged)

    return () => {
      engine.canvas.off('object:modified', onModified)
      engine.canvas.off('object:added', onAdded)
      engine.canvas.off('object:removed', onRemoved)
      engine.canvas.off('text:editing:exited', onTextEditingExited)
      engine.canvas.off('text:changed', onTextChanged)
    }
  }, [isCollaborating, syncObjectToCollab])

  // Cursor tracking for collaboration
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !isCollaborating) return

    const onMouseMove = (opt: any) => {
      const pointer = engine.canvas.getScenePoint(opt.e)
      collabRef.current?.updateCursor(pointer.x, pointer.y)
    }

    const onMouseOut = () => {
      collabRef.current?.clearCursor()
    }

    engine.canvas.on('mouse:move', onMouseMove)
    engine.canvas.on('mouse:out', onMouseOut)

    return () => {
      engine.canvas.off('mouse:move', onMouseMove)
      engine.canvas.off('mouse:out', onMouseOut)
    }
  }, [isCollaborating])

  // Selection sync for collaboration
  useEffect(() => {
    if (isCollaborating && collabRef.current) {
      collabRef.current.updateSelection(selectedIds)
    }
  }, [selectedIds, isCollaborating])

  // === SHARE HANDLER ===
  const handleShare = useCallback(() => {
    setShareModalStep('warning')
    setShareLinkCopied(false)
    setShowShareWarning(true)
  }, [])

  const handleShareConfirm = useCallback(() => {
    prewarmSignalingServer() // Wake up Fly.io server before WebSocket connects
    const rid = generateRoomId()
    setRoomIdInHash(rid)
    startCollaboration(rid)
    const link = `${window.location.origin}${window.location.pathname}#room=${rid}`
    setShareLink(link)
    setShareModalStep('link')
  }, [startCollaboration])

  const handleCopyShareLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setShareLinkCopied(true)
      setTimeout(() => setShareLinkCopied(false), 2000)
    })
  }, [shareLink])

  // === LEAVE ROOM HANDLER ===
  const handleLeaveRoom = useCallback(() => {
    if (collabRef.current) {
      collabRef.current.disconnect()
      collabRef.current = null
    }
    setIsCollaborating(false)
    setRoomId(null)
    roomIdRef.current = null
    setRemoteUsers([])
    prevRemoteUsersCountRef.current = 0
    setComments([])
    setConnectionStatus('disconnected')
    clearRoomFromHash()

    // Clear the canvas of room objects and reload the user's solo project
    // from IndexedDB (falls back to localStorage). Without this, room objects
    // stay on canvas and get auto-saved, bleeding into future sessions.
    const engine = engineRef.current
    if (engine) {
      isReloadingSoloRef.current = true
      engine.clearCanvas()
      persistGet('vigma-pages').then((savedPages) => {
        if (savedPages) {
          try {
            const parsed = JSON.parse(savedPages)
            const currentPage = parsed.pages?.find((p: any) => p.id === parsed.currentPageId) || parsed.pages?.[0]
            if (currentPage?.canvasJSON) {
              engine.loadFromJSON(currentPage.canvasJSON).then(() => {
                isReloadingSoloRef.current = false
                refreshLayers()
              }).catch(() => {
                isReloadingSoloRef.current = false
              })
            } else {
              isReloadingSoloRef.current = false
            }
          } catch (e) {
            isReloadingSoloRef.current = false
            console.warn('Failed to reload solo project after leaving room', e)
          }
        } else {
          isReloadingSoloRef.current = false
        }
      }).catch(() => {
        isReloadingSoloRef.current = false
      })
    }
  }, [refreshLayers])

  // === COMMENT HANDLERS ===
  const handleAddComment = useCallback((x: number, y: number, text: string) => {
    const comment: Comment = {
      id: uuidv4(),
      text,
      author: userRef.current,
      x,
      y,
      timestamp: Date.now(),
      resolved: false,
      replies: [],
    }
    if (collabRef.current) {
      collabRef.current.addComment(comment)
      setComments(collabRef.current.getComments())
    } else {
      // Solo mode - store locally
      setComments(prev => [...prev, comment])
    }
  }, [])

  const handleAddReply = useCallback((commentId: string, text: string) => {
    const reply: CommentReply = {
      id: uuidv4(),
      text,
      author: userRef.current,
      timestamp: Date.now(),
    }
    if (collabRef.current) {
      collabRef.current.addReply(commentId, reply)
      setComments(collabRef.current.getComments())
    } else {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c))
    }
  }, [])

  const handleDeleteComment = useCallback((commentId: string) => {
    if (collabRef.current) {
      collabRef.current.deleteComment(commentId)
      setComments(collabRef.current.getComments())
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }, [])

  const handleDeleteReply = useCallback((commentId: string, replyId: string) => {
    if (collabRef.current) {
      collabRef.current.deleteReply(commentId, replyId)
      setComments(collabRef.current.getComments())
    } else {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: c.replies.filter(r => r.id !== replyId) } : c))
    }
  }, [])

  const handleToggleResolve = useCallback((commentId: string) => {
    if (collabRef.current) {
      collabRef.current.toggleResolve(commentId)
      setComments(collabRef.current.getComments())
    } else {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c))
    }
  }, [])

  const handleScrollToComment = useCallback((comment: Comment) => {
    const engine = engineRef.current
    if (!engine) return
    // Pan canvas to center on comment location
    const vpt = engine.canvas.viewportTransform
    if (vpt) {
      vpt[4] = engine.canvas.getWidth() / 2 - comment.x * vpt[0]
      vpt[5] = engine.canvas.getHeight() / 2 - comment.y * vpt[3]
      engine.canvas.setViewportTransform(vpt)
      engine.canvas.renderAll()
    }
  }, [])

  // Tool changes
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    // Cleanup previous mode
    engine.disableDrawingMode()
    engine.disablePanMode()
    engine.disableEraserMode()
    engine.canvas.defaultCursor = 'default'
    engine.canvas.selection = true
    engine.canvas.forEachObject(o => {
      if (!(o as any).isGrid) {
        o.selectable = !(o as any).lockMovementX
        o.evented = !(o as any).lockMovementX
      }
    })

    switch (activeTool) {
      case 'hand':
        engine.enablePanMode()
        engine.canvas.forEachObject(o => { o.selectable = false; o.evented = false })
        break
      case 'pen':
        engine.enableDrawingMode('pen', { ...brushSettings, width: 2 })
        break
      case 'pencil':
        engine.enableDrawingMode('pencil', brushSettings)
        break
      case 'brush':
        engine.enableDrawingMode('circle', brushSettings)
        break
      case 'eraser':
        engine.enableEraserMode()
        break
      case 'rectangle':
      case 'ellipse':
      case 'triangle':
      case 'line':
      case 'arrow':
      case 'polygon':
      case 'star':
      case 'frame':
      case 'text':
        engine.canvas.defaultCursor = 'crosshair'
        engine.canvas.selection = false
        engine.canvas.forEachObject(o => { o.selectable = false; o.evented = false })
        break
      case 'image':
        // Trigger file upload
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file && engine) {
            if (file.size > 3 * 1024 * 1024) {
              showLargeImageWarning(file.name, file.size)
            }
            await engine.addImageFromFile(file)
            refreshLayers()
            setActiveTool('select')
          }
        }
        input.click()
        setActiveTool('select')
        break
      case 'eyedropper':
        engine.canvas.defaultCursor = 'crosshair'
        engine.canvas.selection = false
        engine.canvas.forEachObject(o => { o.selectable = false; o.evented = false })
        break
      case 'comment':
        engine.canvas.defaultCursor = 'crosshair'
        engine.canvas.selection = false
        engine.canvas.forEachObject(o => { o.selectable = false; o.evented = false })
        break
    }
  }, [activeTool, brushSettings])

  // Canvas click to create shapes
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    const shapeTools: ToolType[] = ['rectangle', 'ellipse', 'triangle', 'line', 'arrow', 'polygon', 'star', 'frame', 'text']

    const handleMouseDown = (opt: any) => {
      if (!shapeTools.includes(activeTool)) return
      if (opt.e.button !== 0) return

      const pointer = engine.canvas.getScenePoint(opt.e)
      drawStartRef.current = { x: pointer.x, y: pointer.y }
      setIsDrawingShape(true)
    }

    // Live shape preview during drag
    const handleMouseMove = (opt: any) => {
      if (!shapeTools.includes(activeTool) || !drawStartRef.current) return
      const pointer = engine.canvas.getScenePoint(opt.e)
      const startX = drawStartRef.current.x
      const startY = drawStartRef.current.y
      const w = Math.abs(pointer.x - startX)
      const h = Math.abs(pointer.y - startY)
      const left = Math.min(startX, pointer.x)
      const top = Math.min(startY, pointer.y)

      // Remove previous preview
      if (previewObjRef.current) {
        engine.canvas.remove(previewObjRef.current)
        previewObjRef.current = null
      }

      if (w < 2 && h < 2) return // Too small to preview

      const { Rect, Ellipse, Triangle, Line, Polygon } = require('fabric')
      let preview: any = null
      const previewStyle = { fill: fill.color + '80', stroke: fill.color, strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true }

      switch (activeTool) {
        case 'rectangle':
        case 'frame':
          preview = new Rect({ left, top, width: w, height: h, ...previewStyle })
          break
        case 'ellipse':
          preview = new Ellipse({ left, top, rx: w / 2, ry: h / 2, ...previewStyle })
          break
        case 'triangle':
          preview = new Triangle({ left, top, width: w, height: h, ...previewStyle })
          break
        case 'line':
        case 'arrow':
          preview = new Line([startX, startY, pointer.x, pointer.y], { ...previewStyle, fill: '' })
          break
        case 'polygon':
          const polyPoints = engine.createPolygonPoints(6, Math.max(w, h) / 2)
          preview = new Polygon(polyPoints, { left, top, ...previewStyle })
          break
        case 'star':
          const starPoints = engine.createStarPoints(5, Math.max(w, h) / 2, Math.max(w, h) / 4)
          preview = new Polygon(starPoints, { left, top, ...previewStyle })
          break
        case 'text':
          preview = new Rect({ left, top, width: Math.max(w, 10), height: Math.max(h, 20), ...previewStyle, fill: 'transparent', strokeDashArray: [4, 4] })
          break
      }

      if (preview) {
        ;(preview as any).isPreview = true
        engine.canvas.add(preview)
        engine.canvas.renderAll()
        previewObjRef.current = preview
      }
    }

    const handleMouseUp = (opt: any) => {
      // Remove preview object
      if (previewObjRef.current) {
        engine.canvas.remove(previewObjRef.current)
        previewObjRef.current = null
      }

      if (!shapeTools.includes(activeTool) || !drawStartRef.current) return

      const pointer = engine.canvas.getScenePoint(opt.e)
      const startX = drawStartRef.current.x
      const startY = drawStartRef.current.y
      const w = Math.abs(pointer.x - startX)
      const h = Math.abs(pointer.y - startY)
      const left = Math.min(startX, pointer.x)
      const top = Math.min(startY, pointer.y)

      // Minimum size to create
      const minW = Math.max(w, 40)
      const minH = Math.max(h, 40)

      switch (activeTool) {
        case 'rectangle':
          engine.addRect({ left, top, width: minW, height: minH, fill: fill.color })
          break
        case 'ellipse':
          engine.addEllipse({ left, top, rx: minW / 2, ry: minH / 2, fill: fill.color })
          break
        case 'triangle':
          engine.addTriangle({ left, top, width: minW, height: minH, fill: fill.color })
          break
        case 'line':
          engine.addLine({ x1: startX, y1: startY, x2: pointer.x, y2: pointer.y })
          break
        case 'arrow':
          engine.addArrow({ x1: startX, y1: startY, x2: pointer.x, y2: pointer.y })
          break
        case 'polygon':
          engine.addPolygon(6, { left, top, fill: fill.color })
          break
        case 'star':
          engine.addStar({ left, top, fill: fill.color })
          break
        case 'frame':
          engine.addFrame({ left, top, width: w < 5 ? 375 : minW, height: h < 5 ? 812 : minH })
          break
        case 'text':
          engine.addText({ left, top, width: Math.max(minW, 150) })
          break
      }

      refreshLayers()
      refreshObjectProps()
      drawStartRef.current = null
      setIsDrawingShape(false)
      setActiveTool('select')
    }

    // Eyedropper
    const handleEyedropper = (opt: any) => {
      if (activeTool !== 'eyedropper') return
      const color = engine.getColorAtPoint(opt.e.offsetX, opt.e.offsetY)
      setFill({ color })
      setActiveTool('select')
    }

    // Comment tool click
    const handleCommentClick = (opt: any) => {
      if (activeTool !== 'comment') return
      if (opt.e.button !== 0) return
      const pointer = engine.canvas.getScenePoint(opt.e)
      setCommentInput({ x: pointer.x, y: pointer.y, text: '' })
    }

    engine.canvas.on('mouse:down', handleMouseDown)
    engine.canvas.on('mouse:move', handleMouseMove)
    engine.canvas.on('mouse:up', handleMouseUp)
    engine.canvas.on('mouse:down', handleEyedropper)
    engine.canvas.on('mouse:down', handleCommentClick)

    return () => {
      engine.canvas.off('mouse:down', handleMouseDown)
      engine.canvas.off('mouse:move', handleMouseMove)
      engine.canvas.off('mouse:up', handleMouseUp)
      engine.canvas.off('mouse:down', handleEyedropper)
      engine.canvas.off('mouse:down', handleCommentClick)
    }
  }, [activeTool, fill])

  // Context menu
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    const handleContextMenu = (opt: any) => {
      if (opt.e.button !== 2) return
      opt.e.preventDefault()
      opt.e.stopPropagation()
      // Capture selection state NOW before Fabric.js changes it
      const active = engine.canvas.getActiveObject()
      const selCount = active ? ((active as any).type === 'activeselection' ? (active as any).getObjects().length : 1) : 0
      setContextMenu({
        visible: true,
        x: opt.e.clientX,
        y: opt.e.clientY,
        hasSelection: selCount > 0,
        multipleSelected: selCount > 1,
        isLocked: active ? !!(active as any).lockMovementX : false,
      })
    }

    engine.canvas.on('mouse:down', handleContextMenu)
    return () => {
      engine.canvas.off('mouse:down', handleContextMenu)
    }
  }, [])

  // Drawing path created -> refresh layers
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    const handlePathCreated = () => {
      refreshLayers()
    }

    engine.canvas.on('path:created', handlePathCreated)
    return () => {
      engine.canvas.off('path:created', handlePathCreated)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current
      if (!engine) return

      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return

      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      // Feature shortcuts gated by keyboardShortcutsEnabled
      // (Critical shortcuts like Ctrl+Z, Ctrl+S, Delete, Escape, arrow keys remain active)
      if (useDesignStore.getState().keyboardShortcutsEnabled) {
        // Feature 90: ? key opens keyboard shortcuts dialog
        if (!ctrl && (e.key === '?' || (shift && e.key === '/'))) {
          setShowKeyboardShortcuts(true)
          e.preventDefault()
          return
        }

        // Feature 91: Shift+R to rotate 90 degrees
        if (shift && !ctrl && e.key.toLowerCase() === 'r') {
          const activeObj = engine.canvas.getActiveObject()
          if (activeObj && (activeObj as any).isEditing) return
          engine.rotateBy(90)
          refreshObjectProps()
          syncActiveToCollab()
          e.preventDefault()
          return
        }

        // Feature 92: Shift+H to flip horizontal
        if (shift && !ctrl && e.key.toLowerCase() === 'h') {
          const activeObj = engine.canvas.getActiveObject()
          if (activeObj && (activeObj as any).isEditing) return
          engine.flipHorizontal()
          refreshObjectProps()
          syncActiveToCollab()
          e.preventDefault()
          return
        }

        // Feature 93: Shift+V to flip vertical
        if (shift && !ctrl && e.key.toLowerCase() === 'v') {
          const activeObj = engine.canvas.getActiveObject()
          if (activeObj && (activeObj as any).isEditing) return
          engine.flipVertical()
          refreshObjectProps()
          syncActiveToCollab()
          e.preventDefault()
          return
        }
      }

      // Tool shortcuts (also gated by keyboardShortcutsEnabled)
      if (!ctrl && !shift && useDesignStore.getState().keyboardShortcutsEnabled) {
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('select'); e.preventDefault(); return
          case 'h': setActiveTool('hand'); e.preventDefault(); return
          case 'r': setActiveTool('rectangle'); e.preventDefault(); return
          case 'o': setActiveTool('ellipse'); e.preventDefault(); return
          case 'l': setActiveTool('line'); e.preventDefault(); return
          case 't': setActiveTool('text'); e.preventDefault(); return
          case 'p': setActiveTool('pen'); e.preventDefault(); return
          case 'b': setActiveTool('brush'); e.preventDefault(); return
          case 'e': setActiveTool('eraser'); e.preventDefault(); return
          case 'f': setActiveTool('frame'); e.preventDefault(); return
          case 'i': setActiveTool('eyedropper'); e.preventDefault(); return
          case 'c': setActiveTool('comment'); e.preventDefault(); return
        }
      }

      // Ctrl shortcuts
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (shift) { engine.redo().then(() => { refreshLayers(); refreshObjectProps() }); } else { engine.undo().then(() => { refreshLayers(); refreshObjectProps() }); }
            e.preventDefault()
            return
          case 'y':
            engine.redo().then(() => { refreshLayers(); refreshObjectProps() })
            e.preventDefault()
            return
          case 'c': engine.copy(); e.preventDefault(); return
          case 'x': engine.cut().then(() => refreshLayers()); e.preventDefault(); return
          case 'v': engine.paste().then(() => refreshLayers()); e.preventDefault(); return
          case 'd': engine.duplicate().then(() => refreshLayers()); e.preventDefault(); return
          case 'a': engine.selectAll(); e.preventDefault(); return
          case 'g':
            if (shift) { engine.ungroupSelected(); } else { engine.groupSelected(); }
            refreshLayers()
            syncAllObjectsToCollab()
            e.preventDefault()
            return
          case ']': engine.bringToFront(); refreshLayers(); syncActiveToCollab(); e.preventDefault(); return
          case '[': engine.sendToBack(); refreshLayers(); syncActiveToCollab(); e.preventDefault(); return
          case '=': engine.zoomIn(); e.preventDefault(); return
          case '-': engine.zoomOut(); e.preventDefault(); return
          case '0': engine.resetZoom(); e.preventDefault(); return
          case '1': engine.zoomToFit(); e.preventDefault(); return
          case 's':
            e.preventDefault()
            handleSaveProject()
            return
        }
      }

      // Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Check if we're editing text
        const activeObj = engine.canvas.getActiveObject()
        if (activeObj && (activeObj as any).isEditing) return
        engine.deleteSelected()
        refreshLayers()
        refreshObjectProps()
        // Force immediate save so deletions persist even if user refreshes right away
        persistAllPages()
        e.preventDefault()
      }

      // Escape
      if (e.key === 'Escape') {
        engine.canvas.discardActiveObject()
        engine.canvas.renderAll()
        setActiveTool('select')
        setContextMenu({ visible: false, x: 0, y: 0, hasSelection: false, multipleSelected: false, isLocked: false })
      }

      // Space bar for temporary hand tool
      if (e.key === ' ' && !e.repeat) {
        setActiveTool('hand')
        e.preventDefault()
      }

      // Arrow keys for nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const active = engine.canvas.getActiveObject()
        if (!active) return
        const step = shift ? 10 : 1
        switch (e.key) {
          case 'ArrowUp': active.set('top', (active.top || 0) - step); break
          case 'ArrowDown': active.set('top', (active.top || 0) + step); break
          case 'ArrowLeft': active.set('left', (active.left || 0) - step); break
          case 'ArrowRight': active.set('left', (active.left || 0) + step); break
        }
        active.setCoords()
        engine.canvas.renderAll()
        refreshObjectProps()
        syncActiveToCollab()
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setActiveTool('select')
      }
    }

    // Feature 94: Double-click to enter text editing (canvas-only, not window)
    const handleDblClick = (e: MouseEvent) => {
      // Only handle double-clicks on the canvas element, not UI elements
      if (!(e.target instanceof HTMLCanvasElement)) return
      const engine = engineRef.current
      if (!engine) return
      const active = engine.canvas.getActiveObject()
      if (active && (active.type === 'textbox' || active.type === 'i-text' || active.type === 'text')) {
        (active as any).enterEditing()
        engine.canvas.renderAll()
      }
    }
    // Feature 95: Canvas mouse move for cursor coordinates (throttled, canvas container only)
    let rafId: number | null = null
    const handleCanvasMouseMove = (e: MouseEvent) => {
      // Only track cursor when over canvas element
      if (!(e.target instanceof HTMLCanvasElement)) return
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const engine = engineRef.current
        if (!engine) return
        const point = engine.getCanvasPointFromEvent(e)
        setCursorPosition(point)
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('dblclick', handleDblClick)
    window.addEventListener('mousemove', handleCanvasMouseMove)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('dblclick', handleDblClick)
      window.removeEventListener('mousemove', handleCanvasMouseMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  // Grid toggle
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (showGrid) {
      engine.showGrid(gridSize)
    } else {
      engine.clearGrid()
    }
  }, [showGrid, gridSize])

  // Snap to grid
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (snapToGrid) {
      engine.enableSnapToGrid(gridSize)
    } else {
      engine.disableSnapToGrid()
    }
    return () => {
      engine.disableSnapToGrid()
    }
  }, [snapToGrid, gridSize])

  // Mark canvas as dirty when user modifies objects
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    const markUnsaved = () => {
      setSaveStatus('unsaved')
    }

    engine.canvas.on('object:modified', markUnsaved)
    engine.canvas.on('object:added', markUnsaved)
    engine.canvas.on('object:removed', markUnsaved)
    engine.canvas.on('path:created', markUnsaved)
    engine.canvas.on('text:changed', markUnsaved)

    return () => {
      engine.canvas.off('object:modified', markUnsaved)
      engine.canvas.off('object:added', markUnsaved)
      engine.canvas.off('object:removed', markUnsaved)
      engine.canvas.off('path:created', markUnsaved)
      engine.canvas.off('text:changed', markUnsaved)
    }
  }, [zoom]) // re-attach after engine init (zoom changes after engine mounts)

  // Helper: persist current canvas state into the Zustand store for the active page,
  // then write ALL pages to IndexedDB (and best-effort localStorage mirror).
  // Always reads from the store directly to avoid stale-closure bugs.
  // IMPORTANT: Skip save during collaboration — the room's objects are persisted
  // via Yjs IndexedDB (per-room). Writing them to global storage would cause stale
  // room data to bleed into other rooms/solo mode.
  const persistAllPages = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    // Don't save while in a collaboration room
    if (collabRef.current) return
    // Don't save while transitioning from room back to solo mode
    // (canvas is temporarily empty between clearCanvas and loadFromJSON)
    if (isReloadingSoloRef.current) return

    const store = useDesignStore.getState()
    // Snapshot the live canvas into the current page's canvasJSON
    store.updatePage(store.currentPageId, { canvasJSON: engine.exportToJSON() })
    // Capture current viewport state for persistence
    const vpt = engine.canvas.viewportTransform
    const currentViewport = vpt
      ? { zoom: engine.canvas.getZoom(), panX: vpt[4], panY: vpt[5] }
      : { zoom: 1, panX: 0, panY: 0 }
    // Build the payload once
    const pagesData = {
      pages: useDesignStore.getState().pages,
      currentPageId: store.currentPageId,
      viewport: currentViewport,
    }
    const payload = JSON.stringify(pagesData)

    // Write to IndexedDB (large-data-safe, handles images of any size).
    // persistSet writes to localStorage synchronously first (critical for
    // beforeunload — the async IndexedDB write may not complete during page
    // unload), then writes to IndexedDB for large payloads that exceed
    // localStorage's ~5MB quota.
    persistSet('vigma-pages', payload).catch((err) => {
      console.warn('Failed to persist pages to IndexedDB', err)
    })
  }, [])

  // SAVE PROJECT (saves all pages) – called by Cmd+S and the "Save to Browser" menu item
  const handleSaveProject = useCallback(() => {
    persistAllPages()
    // Clear any pending timeout so rapid Cmd+S presses don't fight
    if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
    // Show "Saved!" confirmation briefly, then fade back to "saved"
    setSaveStatus('just-saved')
    saveStatusTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved')
    }, 2000)
  }, [persistAllPages])

  // Auto-save every 1 second (aggressive save to prevent data loss)
  // IMPORTANT: persistAllPages() is called directly — NOT inside a React state
  // updater — so that it always runs synchronously regardless of React batching.
  useEffect(() => {
    const interval = setInterval(() => {
      // Bug fix: check autoSaveEnabled before persisting
      if (!useDesignStore.getState().autoSaveEnabled) return
      persistAllPages()
      setSaveStatus(prev => {
        if (prev === 'unsaved') {
          // Brief 'saving' flash, then 'saved'
          setTimeout(() => setSaveStatus('saved'), 400)
          return 'saving'
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [persistAllPages])

  // Save on browser close / refresh to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistAllPages()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [persistAllPages])

  // EXPORT
  // Feature 96: Advanced export handler supporting WebP
  const handleAdvancedExport = useCallback((format: string, scale: number, quality: number) => {
    const engine = engineRef.current
    if (!engine) return
    if (format === 'webp') {
      const dataURL = engine.exportToWebP(quality, scale)
      downloadDataURL(dataURL, 'design.webp')
      showToast('Exported as WebP', 'success')
      return
    }
    if (format === 'png') {
      const dataURL = engine.exportToPNG(scale)
      downloadDataURL(dataURL, 'design.png')
      showToast('Exported as PNG', 'success')
      return
    }
    if (format === 'svg') {
      const svg = engine.exportToSVG()
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      downloadBlob(blob, 'design.svg')
      showToast('Exported as SVG', 'success')
      return
    }
    if (format === 'jpg') {
      const dataURL = engine.exportToJPG(quality, scale)
      downloadDataURL(dataURL, 'design.jpg')
      showToast('Exported as JPG', 'success')
      return
    }
  }, [showToast])

  // Feature 97: Copy as PNG to clipboard
  const handleCopyAsPNG = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    const ok = await engine.copyAsPNG()
    showToast(ok ? 'Copied as PNG' : 'Failed to copy', ok ? 'success' : 'error')
  }, [showToast])

  // Feature 98: Copy as SVG to clipboard
  const handleCopyAsSVG = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    const ok = await engine.copyAsSVG()
    showToast(ok ? 'Copied SVG' : 'Failed to copy', ok ? 'success' : 'error')
  }, [showToast])

  // Feature 99: Copy CSS to clipboard
  const handleCopyAsCSS = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    const ok = await engine.copyCSSToClipboard()
    showToast(ok ? 'Copied CSS' : 'Failed to copy', ok ? 'success' : 'error')
  }, [showToast])

  // Feature 100: Canvas background color change handler
  const handleCanvasBackgroundChange = useCallback((color: string) => {
    const engine = engineRef.current
    if (!engine) return
    engine.setCanvasBackgroundColor(color)
    setCanvasBackground(color)
  }, [setCanvasBackground])

  // Helper: get minimap objects
  const getMiniMapObjects = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return []
    return engine.canvas.getObjects()
      .filter((o: any) => !o.isGrid && !o.isPreview)
      .map((o: any) => ({
        left: o.left || 0,
        top: o.top || 0,
        width: (o.width || 0) * (o.scaleX || 1),
        height: (o.height || 0) * (o.scaleY || 1),
        fill: typeof o.fill === 'string' ? o.fill : '#999',
      }))
  }, [])

  // Helper: get canvas stats
  const getCanvasStats = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return { total: 0, byType: {} }
    return engine.getCanvasStatistics()
  }, [])

  // Minimap navigate handler
  const handleMiniMapNavigate = useCallback((x: number, y: number) => {
    const engine = engineRef.current
    if (!engine) return
    const z = engine.canvas.getZoom()
    const canvasW = engine.canvas.getWidth()
    const canvasH = engine.canvas.getHeight()
    const vpt = engine.canvas.viewportTransform
    if (vpt) {
      vpt[4] = canvasW / 2 - x * z
      vpt[5] = canvasH / 2 - y * z
      engine.canvas.setViewportTransform(vpt)
      engine.onViewportChange?.(z, vpt[4], vpt[5])
    }
  }, [])

  const handleExport = useCallback((format: 'png' | 'svg' | 'jpg' | 'pdf' | 'json') => {
    const engine = engineRef.current
    if (!engine) return

    switch (format) {
      case 'png': {
        const dataURL = engine.exportToPNG(2)
        downloadDataURL(dataURL, 'vigma-export.png')
        break
      }
      case 'svg': {
        const svg = engine.exportToSVG()
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        downloadBlob(blob, 'vigma-export.svg')
        break
      }
      case 'jpg': {
        const dataURL = engine.exportToJPG(0.92, 2)
        downloadDataURL(dataURL, 'vigma-export.jpg')
        break
      }
      case 'pdf': {
        import('jspdf').then(({ jsPDF }) => {
          const dataURL = engine.exportToPNG(2)
          const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [engine.canvas.getWidth(), engine.canvas.getHeight()]
          })
          doc.addImage(dataURL, 'PNG', 0, 0, engine.canvas.getWidth(), engine.canvas.getHeight())
          doc.save('vigma-export.pdf')
        })
        break
      }
      case 'json': {
        const json = engine.exportToJSON()
        const blob = new Blob([json], { type: 'application/json' })
        downloadBlob(blob, 'vigma-project.json')
        break
      }
    }
  }, [])

  const handleImportJSON = useCallback((json: string) => {
    const engine = engineRef.current
    if (!engine) return
    // Save the current page before replacing the canvas with imported data
    persistAllPages()
    engine.loadFromJSON(json).then(() => {
      refreshLayers()
      refreshObjectProps()
    })
  }, [persistAllPages])

  // Show a dismissible warning when the user uploads a large image (>3MB).
  // Large base64-encoded images can affect multiplayer sync performance and
  // may exceed browser storage limits in some edge cases.
  const showLargeImageWarning = useCallback((fileName: string, fileSize: number) => {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1)
    setLargeImageWarning(
      `"${fileName}" is ${sizeMB} MB. Large images may affect performance, especially in multiplayer. Vigma will try its best to save and sync it.`
    )
    // Auto-dismiss after 8 seconds
    if (largeImageWarningTimerRef.current) clearTimeout(largeImageWarningTimerRef.current)
    largeImageWarningTimerRef.current = setTimeout(() => setLargeImageWarning(null), 8000)
  }, [])

  const handleImportImage = useCallback(async (file: File) => {
    const engine = engineRef.current
    if (!engine) return
    if (file.size > 3 * 1024 * 1024) {
      showLargeImageWarning(file.name, file.size)
    }
    await engine.addImageFromFile(file)
    refreshLayers()
  }, [])

  // PAGE MANAGEMENT
  // All page-transition handlers read from `useDesignStore.getState()` directly
  // instead of relying on React closure variables (`currentPageId`, `pages`),
  // which can be stale if the user clicks quickly before React re-renders.

  const handleAddPage = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    const store = useDesignStore.getState()
    // Save current page's canvas state into the store
    store.updatePage(store.currentPageId, { canvasJSON: engine.exportToJSON() })
    const newId = uuidv4()
    store.addPage({ id: newId, name: `Page ${store.pages.length + 1}`, canvasJSON: '' })
    store.setCurrentPageId(newId)
    engine.clearCanvas()
    refreshLayers()
    // Persist immediately so the saved page data isn't lost
    persistAllPages()
  }, [persistAllPages])

  const handleSelectPage = useCallback((id: string) => {
    const engine = engineRef.current
    if (!engine) return
    const store = useDesignStore.getState()
    // Don't switch if already on this page
    if (store.currentPageId === id) return
    // Save current page's canvas state into the store
    store.updatePage(store.currentPageId, { canvasJSON: engine.exportToJSON() })
    store.setCurrentPageId(id)
    // Read the target page from the FRESH store state (after the updatePage above)
    const freshPages = useDesignStore.getState().pages
    const page = freshPages.find(p => p.id === id)
    if (page && page.canvasJSON) {
      engine.loadFromJSON(page.canvasJSON).then(() => {
        refreshLayers()
        refreshObjectProps()
      })
    } else {
      engine.clearCanvas()
      refreshLayers()
    }
    // Persist immediately so the saved page data isn't lost
    persistAllPages()
  }, [persistAllPages])

  const handleDeletePage = useCallback((id: string) => {
    const store = useDesignStore.getState()
    if (store.pages.length <= 1) return
    const engine = engineRef.current
    if (!engine) return
    // If deleting the current page, save canvas first and switch to another
    if (store.currentPageId === id) {
      store.updatePage(store.currentPageId, { canvasJSON: engine.exportToJSON() })
      const remaining = store.pages.filter(p => p.id !== id)
      const switchTo = remaining[0]
      store.setCurrentPageId(switchTo.id)
      if (switchTo.canvasJSON) {
        engine.loadFromJSON(switchTo.canvasJSON).then(() => {
          refreshLayers()
          refreshObjectProps()
        })
      } else {
        engine.clearCanvas()
        refreshLayers()
      }
    }
    store.removePage(id)
    persistAllPages()
  }, [persistAllPages])

  const handleRenamePage = useCallback((id: string, name: string) => {
    updatePage(id, { name })
  }, [])

  // PROPERTY PANEL CALLBACKS
  const handleFillChange = useCallback((color: string) => {
    engineRef.current?.setObjectFill(color)
    setFill({ color })
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleStrokeChange = useCallback((color: string, width?: number) => {
    engineRef.current?.setObjectStroke(color, width)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleOpacityChange = useCallback((opacity: number) => {
    engineRef.current?.setObjectOpacity(opacity)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleCornerRadiusChange = useCallback((radius: number) => {
    engineRef.current?.setCornerRadius(radius)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleShadowChange = useCallback((config: any) => {
    engineRef.current?.setObjectShadow(config)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleShadowRemove = useCallback(() => {
    engineRef.current?.removeShadow()
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handlePositionChange = useCallback((x: number, y: number) => {
    engineRef.current?.setObjectPosition(x, y)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleSizeChange = useCallback((w: number, h: number) => {
    engineRef.current?.setObjectSize(w, h)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleRotationChange = useCallback((angle: number) => {
    engineRef.current?.setObjectRotation(angle)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleTextPropertyChange = useCallback((prop: string, value: any) => {
    engineRef.current?.setTextProperty(prop, value)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleGradientChange = useCallback((config: any) => {
    engineRef.current?.setObjectGradient(config)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleStrokeDashChange = useCallback((dash: number[]) => {
    engineRef.current?.setObjectStrokeDash(dash)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleBlendModeChange = useCallback((mode: string) => {
    engineRef.current?.setBlendMode(mode)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleStrokePositionChange = useCallback((position: 'center' | 'inside' | 'outside') => {
    engineRef.current?.setStrokePosition(position)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleIndividualCornerChange = useCallback((corners: { tl: number, tr: number, br: number, bl: number }) => {
    engineRef.current?.setIndividualCornerRadius(corners)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleBlurChange = useCallback((blur: number) => {
    engineRef.current?.setLayerBlur(blur)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleInnerShadowChange = useCallback((config: { color: string, blur: number, offsetX: number, offsetY: number }) => {
    engineRef.current?.setInnerShadow(config)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleStrokeLineCapChange = useCallback((cap: CanvasLineCap) => {
    engineRef.current?.setStrokeLineCap(cap)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleStrokeLineJoinChange = useCallback((join: CanvasLineJoin) => {
    engineRef.current?.setStrokeLineJoin(join)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleAutoLayout = useCallback((direction: 'horizontal' | 'vertical' | 'wrap' | 'grid', gap?: number) => {
    engineRef.current?.autoLayoutChildren(direction, gap)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleGenerateCode = useCallback((format: 'css' | 'svg' | 'react'): string => {
    return engineRef.current?.generateCodeExport(format) || '// No object selected'
  }, [])

  const handleExportSelected = useCallback((format: string, scale: number) => {
    const engine = engineRef.current
    if (!engine) return
    if (format === 'svg') {
      const svg = engine.exportSelectedToSVG()
      if (svg) {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        downloadBlob(blob, 'selection.svg')
      }
      return
    }
    let dataURL: string | null = null
    if (format === 'png') dataURL = engine.exportSelectedToPNG(scale)
    else if (format === 'jpg') dataURL = engine.exportSelectedToJPG(scale)
    if (dataURL) downloadDataURL(dataURL, `selection.${format}`)
  }, [])

  const handleCropImage = useCallback((crop: { left: number, top: number, width: number, height: number }) => {
    engineRef.current?.cropImage(crop)
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleResetCrop = useCallback(() => {
    engineRef.current?.resetCrop()
    refreshObjectProps()
    syncActiveToCollab()
  }, [syncActiveToCollab])

  const handleFlatten = useCallback(() => {
    engineRef.current?.flattenSelected().then(() => {
      refreshLayers()
      refreshObjectProps()
      syncActiveToCollab()
    })
  }, [syncActiveToCollab])

  // DROP handler for images
  useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      const engine = engineRef.current
      if (!engine) return

      const files = e.dataTransfer?.files
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.type.startsWith('image/')) {
            if (file.size > 3 * 1024 * 1024) {
              showLargeImageWarning(file.name, file.size)
            }
            await engine.addImageFromFile(file)
          }
        }
        refreshLayers()
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    window.addEventListener('drop', handleDrop)
    window.addEventListener('dragover', handleDragOver)
    return () => {
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('dragover', handleDragOver)
    }
  }, [])

  return (
    <MobileGate>
    {/* Peer Disconnect Notification Toast */}
    {peerDisconnectNotice && (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-full mx-4 animate-in fade-in slide-in-from-top-2">
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-800 flex-1">{peerDisconnectNotice}</p>
          <button
            onClick={() => setPeerDisconnectNotice(null)}
            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )}
    {/* Large Image Upload Warning Toast */}
    {largeImageWarning && (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-full mx-4 animate-in fade-in slide-in-from-top-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-amber-800 flex-1">{largeImageWarning}</p>
          <button
            onClick={() => setLargeImageWarning(null)}
            className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )}
    {/* Share Beta Warning Modal */}
    {showShareWarning && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          {shareModalStep === 'warning' ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Experimental Feature</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Live collaboration is <span className="font-semibold text-amber-600">extremely early beta</span> and is known to have bugs.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Currently, only <span className="font-medium">basic shape movement</span> reliably syncs between users. Images, text editing, and other property changes may not work as expected. Use this for fun, but don&apos;t expect production-ready results!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShareWarning(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareConfirm}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-canvas-accent rounded-lg hover:opacity-90 transition-opacity"
                >
                  I understand, start sharing
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Room Created!</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Share this link with others to collaborate in real time:
              </p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono truncate select-all">
                  {shareLink}
                </div>
                <button
                  onClick={handleCopyShareLink}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    shareLinkCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-canvas-accent text-white hover:opacity-90'
                  }`}
                >
                  {shareLinkCopied ? (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Link</>
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowShareWarning(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    )}
    <div className="h-screen w-screen overflow-hidden bg-canvas-bg" ref={containerRef}>
      {/* Top Bar */}
      <TopBar
        zoom={zoom}
        canUndo={canUndo}
        canRedo={canRedo}
        showGrid={showGrid}
        showRulers={showRulers}
        snapToGrid={snapToGrid}
                onUndo={() => { engineRef.current?.undo().then(() => { refreshLayers(); refreshObjectProps() }) }}
                onRedo={() => { engineRef.current?.redo().then(() => { refreshLayers(); refreshObjectProps() }) }}
        onZoomIn={() => engineRef.current?.zoomIn()}
        onZoomOut={() => engineRef.current?.zoomOut()}
        onZoomReset={() => engineRef.current?.resetZoom()}
        onZoomToFit={() => engineRef.current?.zoomToFit()}
        onToggleGrid={toggleGrid}
        onToggleRulers={toggleRulers}
        onToggleSnap={toggleSnapToGrid}
        onExport={handleExport}
        onImportJSON={handleImportJSON}
        onImportImage={handleImportImage}
        onToggleLeftPanel={toggleLeftPanel}
        onToggleRightPanel={toggleRightPanel}
        onClearCanvas={() => { engineRef.current?.clearCanvas(); refreshLayers(); refreshObjectProps() }}
        onSaveProject={handleSaveProject}
        saveStatus={saveStatus}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        isCollaborating={isCollaborating}
        roomId={roomId}
        remoteUsers={remoteUsers}
        connectionStatus={connectionStatus}
        onShare={handleShare}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Left Panel */}
      {leftPanelOpen && (
        <div className="fixed left-0 top-11 bottom-0 bg-white/95 backdrop-blur-xl border-r border-canvas-border z-40 flex flex-col panel-slide-in" style={{ width: leftPanelWidth }}>
          {/* Tab buttons */}
          <div className="flex border-b border-canvas-border">
            <TabButton active={leftPanelTab === 'layers'} onClick={() => setLeftPanelTab('layers')}>Layers</TabButton>
            <TabButton active={leftPanelTab === 'pages'} onClick={() => setLeftPanelTab('pages')}>Pages</TabButton>
            <TabButton active={leftPanelTab === 'comments'} onClick={() => setLeftPanelTab('comments')}><span className="flex items-center gap-0.5 whitespace-nowrap">Chat{comments.filter(c => !c.resolved).length > 0 && <span className="text-xxs bg-canvas-accent text-white rounded-full w-4 h-4 flex items-center justify-center">{comments.filter(c => !c.resolved).length}</span>}</span></TabButton>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {leftPanelTab === 'layers' && (
              <LayersPanel
                layers={layers}
                selectedIds={selectedIds}
                onSelect={(id) => { setActiveTool('select'); engineRef.current?.selectObjectById(id); refreshObjectProps() }}
                onToggleVisibility={(id) => { engineRef.current?.toggleVisibility(id); refreshLayers(); persistAllPages() }}
                onToggleLock={(id) => {
                  const obj = engineRef.current?.canvas.getObjects().find((o: any) => o.id === id)
                  if (obj) {
                    const locked = !obj.lockMovementX
                    obj.set({
                      lockMovementX: locked, lockMovementY: locked,
                      lockRotation: locked, lockScalingX: locked, lockScalingY: locked,
                      hasControls: !locked, selectable: !locked, evented: !locked,
                    })
                    engineRef.current?.canvas.renderAll()
                    refreshLayers()
                    persistAllPages()
                  }
                }}
                onRename={(id, name) => { engineRef.current?.renameObject(id, name); refreshLayers() }}
                onDelete={(id) => {
                  const obj = engineRef.current?.canvas.getObjects().find((o: any) => o.id === id)
                  if (obj) {
                    engineRef.current?.canvas.remove(obj)
                    engineRef.current?.canvas.renderAll()
                    refreshLayers()
                    refreshObjectProps()
                    persistAllPages()
                  }
                }}
                onReorder={(id, index) => { engineRef.current?.moveObjectToIndex(id, index); refreshLayers() }}
                onGroup={() => { engineRef.current?.groupSelected(); refreshLayers() }}
                onUngroup={() => { engineRef.current?.ungroupSelected(); refreshLayers() }}
              />
            )}
            {leftPanelTab === 'pages' && (
              <PagesPanel
                pages={pages}
                currentPageId={currentPageId}
                onSelectPage={handleSelectPage}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                onRenamePage={handleRenamePage}
              />
            )}
            {leftPanelTab === 'comments' && (
              <CommentsPanel
                comments={comments}
                user={userRef.current}
                onAddReply={handleAddReply}
                onDeleteComment={handleDeleteComment}
                onDeleteReply={handleDeleteReply}
                onToggleResolve={handleToggleResolve}
                onScrollToComment={handleScrollToComment}
                showResolved={showResolved}
                onToggleShowResolved={() => setShowResolved(prev => !prev)}
              />
            )}
          </div>
          {/* Resize handle */}
          <div
            className="absolute top-0 bottom-0 right-0 w-1 cursor-col-resize hover:bg-canvas-accent/30 active:bg-canvas-accent/50 transition-colors z-50"
            onMouseDown={(e) => handleResizeStart('left', e)}
          />
        </div>
      )}

      {/* Right Panel */}
      {rightPanelOpen && (
        <div className="fixed right-0 top-11 bottom-0 bg-white/95 backdrop-blur-xl border-l border-canvas-border z-40 overflow-hidden" style={{ width: rightPanelWidth }}>
          <PropertiesPanel
            objectProps={objectProps}
            onPropertyChange={(prop, value) => {
              const active = engineRef.current?.canvas.getActiveObject()
              if (active) { active.set(prop as any, value); engineRef.current?.canvas.renderAll(); refreshObjectProps() }
            }}
            onFillChange={handleFillChange}
            onStrokeChange={handleStrokeChange}
            onOpacityChange={handleOpacityChange}
            onCornerRadiusChange={handleCornerRadiusChange}
            onShadowChange={handleShadowChange}
            onShadowRemove={handleShadowRemove}
            onDelete={() => { engineRef.current?.deleteSelected(); refreshLayers(); refreshObjectProps(); persistAllPages() }}
            onDuplicate={() => { engineRef.current?.duplicate().then(() => refreshLayers()) }}
            onFlipH={() => { engineRef.current?.flipHorizontal(); refreshObjectProps() }}
            onFlipV={() => { engineRef.current?.flipVertical(); refreshObjectProps() }}
            onBringToFront={() => { engineRef.current?.bringToFront(); refreshLayers() }}
            onSendToBack={() => { engineRef.current?.sendToBack(); refreshLayers() }}
            onBringForward={() => { engineRef.current?.bringForward(); refreshLayers() }}
            onSendBackward={() => { engineRef.current?.sendBackward(); refreshLayers() }}
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
            onRotationChange={handleRotationChange}
            onTextPropertyChange={handleTextPropertyChange}
            onLock={(lock) => { engineRef.current?.lockObject(lock); refreshLayers(); refreshObjectProps() }}
            onGradientChange={handleGradientChange}
            onStrokeDashChange={handleStrokeDashChange}
            onAlignObjects={(align) => { engineRef.current?.alignObjects(align as any); refreshObjectProps() }}
            onDistribute={(dir) => { engineRef.current?.distributeObjects(dir); refreshObjectProps() }}
            onBlendModeChange={handleBlendModeChange}
            onStrokePositionChange={handleStrokePositionChange}
            onIndividualCornerChange={handleIndividualCornerChange}
            onBlurChange={handleBlurChange}
            onInnerShadowChange={handleInnerShadowChange}
            onExportSelected={handleExportSelected}
            onCropImage={handleCropImage}
            onResetCrop={handleResetCrop}
            onFlatten={handleFlatten}
            onStrokeLineCapChange={handleStrokeLineCapChange}
            onStrokeLineJoinChange={handleStrokeLineJoinChange}
            onAutoLayout={handleAutoLayout}
            onGenerateCode={handleGenerateCode}
          />
          {/* Resize handle */}
          <div
            className="absolute top-0 bottom-0 left-0 w-1 cursor-col-resize hover:bg-canvas-accent/30 active:bg-canvas-accent/50 transition-colors z-50"
            onMouseDown={(e) => handleResizeStart('right', e)}
          />
        </div>
      )}

      {/* Rulers */}
      <Rulers
        zoom={zoom}
        panX={viewport.panX}
        panY={viewport.panY}
        showRulers={showRulers}
        leftOffset={leftPanelOpen ? leftPanelWidth : 0}
        topOffset={44}
      />

      {/* Canvas */}
      <div
        className="absolute inset-0 pt-11"
        style={{
          left: leftPanelOpen ? leftPanelWidth : 0,
          right: rightPanelOpen ? rightPanelWidth : 0,
        }}
      >
        <canvas ref={canvasRef} />

        {/* Live cursors overlay */}
        {isCollaborating && (
          <CursorOverlay
            users={remoteUsers}
            zoom={zoom}
            panX={viewport.panX}
            panY={viewport.panY}
          />
        )}

        {/* Comment pins overlay */}
        {comments.length > 0 && (
          <CommentPins
            comments={comments}
            user={userRef.current}
            zoom={zoom}
            panX={viewport.panX}
            panY={viewport.panY}
            onReply={handleAddReply}
            onDelete={handleDeleteComment}
            onDeleteReply={handleDeleteReply}
            onToggleResolve={handleToggleResolve}
            showResolved={showResolved}
          />
        )}

        {/* Comment input popup */}
        {commentInput && (
          <div
            className="absolute z-50"
            style={{
              left: commentInput.x * zoom + viewport.panX,
              top: commentInput.y * zoom + viewport.panY,
            }}
          >
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 -translate-x-4 translate-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: userRef.current.color }}
                >
                  {userRef.current.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-gray-700">{userRef.current.name}</span>
              </div>
              <textarea
                autoFocus
                value={commentInput.text}
                onChange={(e) => setCommentInput(prev => prev ? { ...prev, text: e.target.value } : null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (commentInput.text.trim()) {
                      handleAddComment(commentInput.x, commentInput.y, commentInput.text.trim())
                      setCommentInput(null)
                      setActiveTool('select')
                    }
                  }
                  if (e.key === 'Escape') {
                    setCommentInput(null)
                    setActiveTool('select')
                  }
                }}
                placeholder="Add a comment..."
                className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                rows={2}
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  onClick={() => { setCommentInput(null); setActiveTool('select') }}
                  className="text-[10px] px-2 py-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (commentInput.text.trim()) {
                      handleAddComment(commentInput.x, commentInput.y, commentInput.text.trim())
                      setCommentInput(null)
                      setActiveTool('select')
                    }
                  }}
                  disabled={!commentInput.text.trim()}
                  className="text-[10px] px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, hasSelection: false, multipleSelected: false, isLocked: false })}
        onCopy={() => engineRef.current?.copy()}
        onCut={() => { engineRef.current?.cut().then(() => refreshLayers()) }}
        onPaste={() => { engineRef.current?.paste().then(() => refreshLayers()) }}
        onDuplicate={() => { engineRef.current?.duplicate().then(() => refreshLayers()) }}
        onDelete={() => { engineRef.current?.deleteSelected(); refreshLayers(); refreshObjectProps(); persistAllPages() }}
        onSelectAll={() => engineRef.current?.selectAll()}
        onBringToFront={() => { engineRef.current?.bringToFront(); refreshLayers() }}
        onSendToBack={() => { engineRef.current?.sendToBack(); refreshLayers() }}
        onBringForward={() => { engineRef.current?.bringForward(); refreshLayers() }}
        onSendBackward={() => { engineRef.current?.sendBackward(); refreshLayers() }}
        onGroup={() => { engineRef.current?.groupSelected(); refreshLayers() }}
        onUngroup={() => { engineRef.current?.ungroupSelected(); refreshLayers() }}
        onFlipH={() => engineRef.current?.flipHorizontal()}
        onFlipV={() => engineRef.current?.flipVertical()}
        onLock={() => {
          const active = engineRef.current?.canvas.getActiveObject()
          if (active) {
            engineRef.current?.lockObject(!active.lockMovementX)
            refreshLayers()
            refreshObjectProps()
          }
        }}
        onBooleanUnion={() => { engineRef.current?.booleanUnion(); refreshLayers(); refreshObjectProps() }}
        onBooleanSubtract={() => { engineRef.current?.booleanSubtract(); refreshLayers(); refreshObjectProps() }}
        onBooleanIntersect={() => { engineRef.current?.booleanIntersect(); refreshLayers(); refreshObjectProps() }}
        onBooleanExclude={() => { engineRef.current?.booleanExclude(); refreshLayers(); refreshObjectProps() }}
        onMask={() => { engineRef.current?.applyMask(); refreshLayers(); refreshObjectProps() }}
        onRemoveMask={() => { engineRef.current?.removeMask(); refreshLayers(); refreshObjectProps() }}
        hasSelection={contextMenu.hasSelection}
        isLocked={contextMenu.isLocked}
        multipleSelected={contextMenu.multipleSelected}
      />

      {/* Welcome modal for first-time visitors */}
      <WelcomeModal />

      {/* Feature 71: Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* Feature 72: Status Bar */}
      <StatusBar
        objectCount={engineRef.current?.getObjectCount() || 0}
        zoom={zoom}
      />

      {/* Feature 73: Toast Notification */}
      <ToastNotification />

      {/* Feature 75: MiniMap */}
      <MiniMap
        canvasWidth={typeof window !== 'undefined' ? window.innerWidth : 1920}
        canvasHeight={typeof window !== 'undefined' ? window.innerHeight : 1080}
        viewportX={viewport.panX}
        viewportY={viewport.panY}
        zoom={zoom}
        objects={getMiniMapObjects()}
        onNavigate={handleMiniMapNavigate}
        visible={showMinimap}
      />

      {/* Feature 76: Object Info Overlay */}
      <ObjectInfoOverlay
        visible={showObjectInfo && selectedIds.length === 1}
        x={objectInfoPos.x}
        y={objectInfoPos.y}
        width={objectProps?.width || 0}
        height={objectProps?.height || 0}
        rotation={objectProps?.angle || 0}
        type={objectProps?.type || ''}
        name={objectProps?.name || ''}
      />

      {/* Feature 77: Grid Settings Panel */}
      <GridSettingsPanel
        open={showGridSettings}
        onClose={() => setShowGridSettings(false)}
        gridSize={gridSize}
        onGridSizeChange={(size) => useDesignStore.getState().setGridSize(size)}
        gridEnabled={showGrid}
        onToggleGrid={toggleGrid}
        snapEnabled={snapToGrid}
        onToggleSnap={toggleSnapToGrid}
      />

      {/* Feature 78: Export Settings Dialog */}
      <ExportSettingsDialog
        open={showExportSettings}
        onClose={() => setShowExportSettings(false)}
        onExport={handleAdvancedExport}
        onCopyAsPNG={handleCopyAsPNG}
        onCopyAsSVG={handleCopyAsSVG}
        onCopyAsCSS={handleCopyAsCSS}
      />

      {/* Feature 79: Canvas Background Picker */}
      <CanvasBackgroundPicker
        open={showCanvasBgPicker}
        onClose={() => setShowCanvasBgPicker(false)}
        color={canvasBackground}
        onChange={handleCanvasBackgroundChange}
      />

      {/* Feature 80: Selection Info Badge */}
      <SelectionInfoBadge
        count={selectedIds.length}
        type={objectProps?.type || 'object'}
        visible={showSelectionDimensions && selectedIds.length > 0}
      />

      {/* Feature 87: Bulk Operations Bar */}
      <BulkOperationsBar
        selectedCount={selectedIds.length}
        onDelete={() => { engineRef.current?.deleteSelected(); refreshLayers(); refreshObjectProps() }}
        onDuplicate={() => { engineRef.current?.duplicate().then(() => refreshLayers()) }}
        onLock={() => { engineRef.current?.lockObject(true); refreshLayers(); refreshObjectProps() }}
        onUnlock={() => { engineRef.current?.lockObject(false); refreshLayers(); refreshObjectProps() }}
        onShow={() => { /* toggle visibility handled per-object */ }}
        onHide={() => { /* toggle visibility handled per-object */ }}
        onFlipH={() => { engineRef.current?.flipHorizontal(); refreshObjectProps() }}
        onFlipV={() => { engineRef.current?.flipVertical(); refreshObjectProps() }}
        onRotate90={() => { engineRef.current?.rotateBy(90); refreshObjectProps() }}
      />

      {/* Feature 88: Workspace Info */}
      <WorkspaceInfo
        open={showWorkspaceInfo}
        onClose={toggleWorkspaceInfo}
        stats={getCanvasStats()}
        pageCount={pages.length}
        currentPage={pages.find(p => p.id === currentPageId)?.name || 'Page 1'}
        zoom={zoom}
        canvasSize={{ width: typeof window !== 'undefined' ? window.innerWidth : 1920, height: typeof window !== 'undefined' ? window.innerHeight : 1080 }}
      />

      {/* Feature 89: View Menu */}
      <ViewMenu
        open={showViewMenuState}
        onClose={() => setShowViewMenuState(false)}
        onToggleGrid={toggleGrid}
        onToggleRulers={toggleRulers}
        onToggleGuides={() => {}}
        onZoomToFit={() => engineRef.current?.zoomToFit()}
        onZoomToFitWidth={() => engineRef.current?.zoomToFitWidth()}
        onZoomToFitHeight={() => engineRef.current?.zoomToFitHeight()}
        onResetZoom={() => engineRef.current?.resetZoom()}
        onOpenGridSettings={() => setShowGridSettings(true)}
        onOpenCanvasBg={() => setShowCanvasBgPicker(true)}
        gridEnabled={showGrid}
        rulersEnabled={showRulers}
        guidesEnabled={false}
      />

      {/* FeatureHub: Wires all 600 features into the live UI */}
      <FeatureHub
        engineRef={engineRef}
        refreshLayers={refreshLayers}
        refreshObjectProps={refreshObjectProps}
        syncActiveToCollab={syncActiveToCollab}
        selectedIds={selectedIds}
        objectProps={objectProps}
        zoom={zoom}
        activeTool={activeTool}
        pages={pages}
        currentPageId={currentPageId}
      />
    </div>
    </MobileGate>
  )
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 px-3 py-2 text-xs font-medium transition-colors relative
        ${active
          ? 'text-canvas-accent'
          : 'text-canvas-text-secondary hover:text-canvas-text'
        }
      `}
    >
      {children}
      {active && (
        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-canvas-accent rounded-full" />
      )}
    </button>
  )
}

function downloadDataURL(dataURL: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  downloadDataURL(url, filename)
  URL.revokeObjectURL(url)
}
