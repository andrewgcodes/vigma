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
import { CollaborationManager, generateRoomId, getRoomIdFromHash, setRoomIdInHash, clearRoomFromHash } from '@/lib/collaboration'
import type { Comment, CommentReply, RemoteUser } from '@/lib/collaboration'
import { getUserIdentity } from '@/lib/userIdentity'
import type { UserIdentity } from '@/lib/userIdentity'
import { v4 as uuidv4 } from 'uuid'
import type { ToolType } from '@/types/design'
import WelcomeModal from '@/components/WelcomeModal'

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
  } = useDesignStore()

  const [layers, setLayers] = useState<any[]>([])
  const [objectProps, setObjectProps] = useState<Record<string, any> | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, hasSelection: false, multipleSelected: false, isLocked: false })
  const [isDrawingShape, setIsDrawingShape] = useState(false)
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
  const collabRef = useRef<CollaborationManager | null>(null)
  const userRef = useRef<UserIdentity>(getUserIdentity())
  const syncingFromRemoteCountRef = useRef(0)

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
      },
      onObjectModified: () => {
        refreshLayers()
        refreshObjectProps()
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

    // Load saved project from localStorage
    const loadSaved = async () => {
      try {
        const saved = localStorage.getItem('vigma-project')
        if (saved) {
          await engine.loadFromJSON(saved)
          refreshLayers()
        }
      } catch (e) {
        // If saved data is corrupt or incompatible, clear it
        console.warn('Failed to load saved project, clearing localStorage', e)
        localStorage.removeItem('vigma-project')
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
    if (!collab || syncingFromRemoteCountRef.current > 0) return
    if (!obj || !obj.id) return
    try {
      const json = JSON.stringify(obj.toJSON(['id', 'name', 'isFrame', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls', 'selectable', 'evented']))
      collab.syncObjectToYjs(obj.id, json)
    } catch (e) {
      console.warn('Failed to sync object to collab', e)
    }
  }, [])

  // Sync all canvas objects to Yjs
  const syncAllObjectsToCollab = useCallback(() => {
    const collab = collabRef.current
    const engine = engineRef.current
    if (!collab || !engine || syncingFromRemoteCountRef.current > 0) return
    const objects = engine.canvas.getObjects().filter((o: any) => !o.isPreview && !o.isGrid)
    const items = objects.map((obj: any) => {
      if (!obj.id) obj.id = uuidv4()
      return {
        id: obj.id,
        json: JSON.stringify(obj.toJSON(['id', 'name', 'isFrame', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls', 'selectable', 'evented'])),
      }
    })
    collab.pushCanvasState(items)
  }, [])

  // Handle remote object changes from Yjs
  const handleRemoteObjectChange = useCallback((changes: { added: string[], updated: string[], deleted: string[] }) => {
    const engine = engineRef.current
    const collab = collabRef.current
    if (!engine || !collab) return

    syncingFromRemoteCountRef.current++

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
          // Update existing object
          existing.set(objData)
          existing.setCoords()
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

    // Only decrement the counter after all async enlivens complete
    if (enlivenPromises.length > 0) {
      Promise.all(enlivenPromises).catch((e) => {
        console.warn('Failed to enliven remote objects', e)
      }).finally(() => {
        syncingFromRemoteCountRef.current--
      })
    } else {
      syncingFromRemoteCountRef.current--
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
      if (newRoomId && !collabRef.current) {
        startCollaboration(newRoomId)
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
        setRemoteUsers(users)
      },
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status)
      },
    })

    setRoomId(rid)
    setIsCollaborating(true)
    setConnectionStatus('connecting')

    // Wait for IndexedDB persistence to finish loading (or timeout after 3s)
    // This ensures we don't push empty state before persisted data loads
    await collab.waitForSync(3000)

    // After persistence sync, check if the room has objects
    // Only push local canvas state if the room is truly empty
    if (collab.getAllObjects().size === 0) {
      syncAllObjectsToCollab()
    }
    setComments(collab.getComments())
  }, [handleRemoteObjectChange, syncAllObjectsToCollab])

  // Canvas event listeners for collaboration sync
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !isCollaborating) return

    const onModified = (opt: any) => {
      if (syncingFromRemoteCountRef.current > 0) return
      const target = opt.target
      if (!target) return
      if ((target as any).type === 'activeselection') {
        // Multiple objects selected and moved
        const objects = (target as any).getObjects()
        for (const obj of objects) {
          syncObjectToCollab(obj)
        }
      } else {
        syncObjectToCollab(target)
      }
    }

    const onAdded = (opt: any) => {
      if (syncingFromRemoteCountRef.current > 0) return
      const target = opt.target
      if (!target || (target as any).isPreview || (target as any).isGrid) return
      if (!target.id) target.id = uuidv4()
      syncObjectToCollab(target)
    }

    const onRemoved = (opt: any) => {
      if (syncingFromRemoteCountRef.current > 0) return
      const target = opt.target
      if (!target || !target.id || (target as any).isPreview || (target as any).isGrid) return
      collabRef.current?.removeObjectFromYjs(target.id)
    }

    const onPathCreated = (opt: any) => {
      if (syncingFromRemoteCountRef.current > 0) return
      const path = opt.path
      if (!path) return
      if (!path.id) path.id = uuidv4()
      syncObjectToCollab(path)
    }

    engine.canvas.on('object:modified', onModified)
    engine.canvas.on('object:added', onAdded)
    engine.canvas.on('object:removed', onRemoved)
    engine.canvas.on('path:created', onPathCreated)

    return () => {
      engine.canvas.off('object:modified', onModified)
      engine.canvas.off('object:added', onAdded)
      engine.canvas.off('object:removed', onRemoved)
      engine.canvas.off('path:created', onPathCreated)
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
    const rid = generateRoomId()
    setRoomIdInHash(rid)
    startCollaboration(rid)
  }, [startCollaboration])

  // === LEAVE ROOM HANDLER ===
  const handleLeaveRoom = useCallback(() => {
    if (collabRef.current) {
      collabRef.current.disconnect()
      collabRef.current = null
    }
    setIsCollaborating(false)
    setRoomId(null)
    setRemoteUsers([])
    setComments([])
    setConnectionStatus('disconnected')
    clearRoomFromHash()
  }, [])

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

      // Tool shortcuts
      if (!ctrl && !shift) {
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
            e.preventDefault()
            return
          case ']': engine.bringToFront(); refreshLayers(); e.preventDefault(); return
          case '[': engine.sendToBack(); refreshLayers(); e.preventDefault(); return
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
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setActiveTool('select')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
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

  // SAVE PROJECT
  const handleSaveProject = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    const json = engine.exportToJSON()
    localStorage.setItem('vigma-project', json)
  }, [])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const engine = engineRef.current
      if (!engine) return
      try {
        const json = engine.exportToJSON()
        localStorage.setItem('vigma-project', json)
      } catch (e) {}
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // EXPORT
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
    engine.loadFromJSON(json).then(() => {
      refreshLayers()
      refreshObjectProps()
    })
  }, [])

  const handleImportImage = useCallback(async (file: File) => {
    const engine = engineRef.current
    if (!engine) return
    await engine.addImageFromFile(file)
    refreshLayers()
  }, [])

  // PAGE MANAGEMENT
  const handleAddPage = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    // Save current page
    updatePage(currentPageId, { canvasJSON: engine.exportToJSON() })
    const newId = uuidv4()
    addPage({ id: newId, name: `Page ${pages.length + 1}`, canvasJSON: '' })
    setCurrentPageId(newId)
    engine.clearCanvas()
    refreshLayers()
  }, [currentPageId, pages.length])

  const handleSelectPage = useCallback((id: string) => {
    const engine = engineRef.current
    if (!engine) return
    // Save current page
    updatePage(currentPageId, { canvasJSON: engine.exportToJSON() })
    setCurrentPageId(id)
    const page = pages.find(p => p.id === id)
    if (page && page.canvasJSON) {
      engine.loadFromJSON(page.canvasJSON).then(() => {
        refreshLayers()
        refreshObjectProps()
      })
    } else {
      engine.clearCanvas()
      refreshLayers()
    }
  }, [currentPageId, pages])

  const handleDeletePage = useCallback((id: string) => {
    if (pages.length <= 1) return
    const remaining = pages.filter(p => p.id !== id)
    if (currentPageId === id) {
      // Switch to another page first (saves current canvas), then remove
      handleSelectPage(remaining[0].id)
    }
    removePage(id)
  }, [currentPageId, pages, handleSelectPage])

  const handleRenamePage = useCallback((id: string, name: string) => {
    updatePage(id, { name })
  }, [])

  // PROPERTY PANEL CALLBACKS
  const handleFillChange = useCallback((color: string) => {
    engineRef.current?.setObjectFill(color)
    setFill({ color })
    refreshObjectProps()
  }, [])

  const handleStrokeChange = useCallback((color: string, width?: number) => {
    engineRef.current?.setObjectStroke(color, width)
    refreshObjectProps()
  }, [])

  const handleOpacityChange = useCallback((opacity: number) => {
    engineRef.current?.setObjectOpacity(opacity)
    refreshObjectProps()
  }, [])

  const handleCornerRadiusChange = useCallback((radius: number) => {
    engineRef.current?.setCornerRadius(radius)
    refreshObjectProps()
  }, [])

  const handleShadowChange = useCallback((config: any) => {
    engineRef.current?.setObjectShadow(config)
    refreshObjectProps()
  }, [])

  const handleShadowRemove = useCallback(() => {
    engineRef.current?.removeShadow()
    refreshObjectProps()
  }, [])

  const handlePositionChange = useCallback((x: number, y: number) => {
    engineRef.current?.setObjectPosition(x, y)
    refreshObjectProps()
  }, [])

  const handleSizeChange = useCallback((w: number, h: number) => {
    engineRef.current?.setObjectSize(w, h)
    refreshObjectProps()
  }, [])

  const handleRotationChange = useCallback((angle: number) => {
    engineRef.current?.setObjectRotation(angle)
    refreshObjectProps()
  }, [])

  const handleTextPropertyChange = useCallback((prop: string, value: any) => {
    engineRef.current?.setTextProperty(prop, value)
    refreshObjectProps()
  }, [])

  const handleGradientChange = useCallback((config: any) => {
    engineRef.current?.setObjectGradient(config)
    refreshObjectProps()
  }, [])

  const handleStrokeDashChange = useCallback((dash: number[]) => {
    engineRef.current?.setObjectStrokeDash(dash)
    refreshObjectProps()
  }, [])

  const handleBlendModeChange = useCallback((mode: string) => {
    engineRef.current?.setBlendMode(mode)
    refreshObjectProps()
  }, [])

  const handleStrokePositionChange = useCallback((position: 'center' | 'inside' | 'outside') => {
    engineRef.current?.setStrokePosition(position)
    refreshObjectProps()
  }, [])

  const handleIndividualCornerChange = useCallback((corners: { tl: number, tr: number, br: number, bl: number }) => {
    engineRef.current?.setIndividualCornerRadius(corners)
    refreshObjectProps()
  }, [])

  const handleBlurChange = useCallback((blur: number) => {
    engineRef.current?.setLayerBlur(blur)
    refreshObjectProps()
  }, [])

  const handleInnerShadowChange = useCallback((config: { color: string, blur: number, offsetX: number, offsetY: number }) => {
    engineRef.current?.setInnerShadow(config)
    refreshObjectProps()
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
  }, [])

  const handleResetCrop = useCallback(() => {
    engineRef.current?.resetCrop()
    refreshObjectProps()
  }, [])

  const handleFlatten = useCallback(() => {
    engineRef.current?.flattenSelected().then(() => {
      refreshLayers()
      refreshObjectProps()
    })
  }, [])

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
                onSelect={(id) => engineRef.current?.selectObjectById(id)}
                onToggleVisibility={(id) => { engineRef.current?.toggleVisibility(id); refreshLayers() }}
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
            onDelete={() => { engineRef.current?.deleteSelected(); refreshLayers(); refreshObjectProps() }}
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
        onDelete={() => { engineRef.current?.deleteSelected(); refreshLayers(); refreshObjectProps() }}
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
    </div>
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
