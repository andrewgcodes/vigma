'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { useStore } from '@/store/useStore';
import {
  generateId,
  getObjectName,
  createStarPoints,
  createPolygonPoints,
  snapToGridValue,
  createGrid,
  removeGrid,
} from '@/utils/canvas-helpers';

type ExtendedFabricObject = fabric.FabricObject & {
  id?: string;
  customName?: string;
  isGrid?: boolean;
  isFrame?: boolean;
};

// Register custom properties so they are included in toJSON/toObject serialization
fabric.FabricObject.customProperties = ['id', 'customName', 'isGrid', 'isFrame'];

export function useCanvas() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingShape = useRef(false);
  const drawStart = useRef({ x: 0, y: 0 });
  const tempShape = useRef<fabric.FabricObject | null>(null);
  const clipboardRef = useRef<fabric.FabricObject[]>([]);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  const {
    activeTool,
    setActiveTool,
    setSelectedIds,
    setLayers,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity,
    fontSize,
    fontFamily,
    cornerRadius,
    zoom,
    setZoom,
    showGrid,
    snapToGrid,
    gridSize,
    pushHistory,
    history,
    historyIndex,
    setHistoryIndex,
  } = useStore();

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Custom properties are registered via FabricObject.customProperties above
    const json = JSON.stringify(canvas.toJSON());
    pushHistory({ json, timestamp: Date.now() });
  }, [pushHistory]);

  const syncLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects().filter(
      (obj) => !(obj as ExtendedFabricObject).isGrid
    );
    const layerInfos = objects.map((obj) => {
      const extObj = obj as ExtendedFabricObject;
      return {
        id: extObj.id || '',
        name: extObj.customName || getObjectName(obj),
        type: obj.type || 'object',
        visible: obj.visible !== false,
        locked: !obj.selectable,
      };
    }).reverse();
    setLayers(layerInfos);
  }, [setLayers]);

  const initCanvas = useCallback(
    (canvasEl: HTMLCanvasElement) => {
      canvasElRef.current = canvasEl;

      const canvas = new fabric.Canvas(canvasEl, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#f5f5f5',
        selection: true,
        preserveObjectStacking: true,
        stopContextMenu: true,
        fireRightClick: true,
        controlsAboveOverlay: true,
      });

      // Configure default object settings
      fabric.FabricObject.ownDefaults.transparentCorners = false;
      fabric.FabricObject.ownDefaults.cornerColor = '#3b82f6';
      fabric.FabricObject.ownDefaults.cornerStyle = 'circle';
      fabric.FabricObject.ownDefaults.cornerSize = 8;
      fabric.FabricObject.ownDefaults.borderColor = '#3b82f6';
      fabric.FabricObject.ownDefaults.borderScaleFactor = 1.5;
      fabric.FabricObject.ownDefaults.padding = 0;
      fabric.FabricObject.ownDefaults.originX = 'left';
      fabric.FabricObject.ownDefaults.originY = 'top';

      canvasRef.current = canvas;

      // Selection events
      canvas.on('selection:created', () => {
        const activeObjects = canvas.getActiveObjects();
        const ids = activeObjects
          .map((obj) => (obj as ExtendedFabricObject).id)
          .filter(Boolean) as string[];
        setSelectedIds(ids);
      });

      canvas.on('selection:updated', () => {
        const activeObjects = canvas.getActiveObjects();
        const ids = activeObjects
          .map((obj) => (obj as ExtendedFabricObject).id)
          .filter(Boolean) as string[];
        setSelectedIds(ids);
      });

      canvas.on('selection:cleared', () => {
        setSelectedIds([]);
      });

      // Object modification events
      canvas.on('object:modified', () => {
        saveHistory();
        syncLayers();
      });

      canvas.on('object:added', () => {
        syncLayers();
      });

      canvas.on('object:removed', () => {
        syncLayers();
      });

      // Zoom with mouse wheel
      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let newZoom = canvas.getZoom() * (1 - delta / 500);
        newZoom = Math.max(0.1, Math.min(5, newZoom));
        canvas.zoomToPoint(
          new fabric.Point(opt.e.offsetX, opt.e.offsetY),
          newZoom
        );
        setZoom(Math.round(newZoom * 100));
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      // Window resize
      const handleResize = () => {
        canvas.setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        canvas.requestRenderAll();
      };
      window.addEventListener('resize', handleResize);

      // Initial history
      saveHistory();

      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.dispose();
      };
    },
    [setSelectedIds, setZoom, saveHistory, syncLayers]
  );

  // Handle tool changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'pencil';
    canvas.selection = activeTool === 'select';

    if (activeTool === 'pencil') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor || '#000000';
      canvas.freeDrawingBrush.width = strokeWidth || 2;
    }

    // Set cursor based on tool
    switch (activeTool) {
      case 'hand':
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        break;
      case 'text':
        canvas.defaultCursor = 'text';
        canvas.hoverCursor = 'text';
        break;
      case 'pencil':
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        break;
      case 'select':
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        break;
      default:
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
    }
  }, [activeTool, strokeColor, strokeWidth]);

  // Handle grid visibility
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    removeGrid(canvas);
    if (showGrid) {
      createGrid(canvas, gridSize);
    }
    canvas.requestRenderAll();
  }, [showGrid, gridSize]);

  // Mouse event handlers for drawing shapes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getClientPos = (e: Event): { x: number; y: number } => {
      if ('clientX' in e) return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
      if ('touches' in e && (e as TouchEvent).touches.length > 0) {
        return { x: (e as TouchEvent).touches[0].clientX, y: (e as TouchEvent).touches[0].clientY };
      }
      return { x: 0, y: 0 };
    };

    const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
      const pointer = canvas.getScenePoint(opt.e);
      const clientPos = getClientPos(opt.e);

      // Hand tool panning
      if (activeTool === 'hand') {
        isPanning.current = true;
        lastPanPoint.current = clientPos;
        canvas.defaultCursor = 'grabbing';
        return;
      }

      // Middle mouse button panning
      if ('button' in opt.e && (opt.e as MouseEvent).button === 1) {
        isPanning.current = true;
        lastPanPoint.current = clientPos;
        return;
      }

      // Text tool
      if (activeTool === 'text') {
        const text = new fabric.IText('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth > 0 ? strokeWidth : 0,
          opacity: opacity / 100,
          originX: 'left',
          originY: 'top',
        }) as ExtendedFabricObject;
        text.id = generateId();
        text.customName = 'Text';
        canvas.add(text as fabric.FabricObject);
        canvas.setActiveObject(text as fabric.FabricObject);
        (text as fabric.IText).enterEditing();
        saveHistory();
        setActiveTool('select');
        return;
      }

      // Shape drawing tools
      const shapeTools = [
        'rectangle', 'ellipse', 'line', 'arrow', 'triangle', 'star', 'polygon', 'frame',
      ];
      if (!shapeTools.includes(activeTool)) return;

      isDrawingShape.current = true;
      const px = snapToGrid ? snapToGridValue(pointer.x, gridSize) : pointer.x;
      const py = snapToGrid ? snapToGridValue(pointer.y, gridSize) : pointer.y;
      drawStart.current = { x: px, y: py };

      let shape: fabric.FabricObject | null = null;

      switch (activeTool) {
        case 'rectangle':
          shape = new fabric.Rect({
            left: px,
            top: py,
            width: 0,
            height: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity / 100,
            rx: cornerRadius,
            ry: cornerRadius,
            originX: 'left',
            originY: 'top',
          });
          break;
        case 'ellipse':
          shape = new fabric.Ellipse({
            left: px,
            top: py,
            rx: 0,
            ry: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity / 100,
            originX: 'left',
            originY: 'top',
          });
          break;
        case 'line':
        case 'arrow':
          shape = new fabric.Line([px, py, px, py], {
            stroke: strokeColor || '#000000',
            strokeWidth: strokeWidth || 2,
            opacity: opacity / 100,
            originX: 'left',
            originY: 'top',
          });
          break;
        case 'triangle':
          shape = new fabric.Triangle({
            left: px,
            top: py,
            width: 0,
            height: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity / 100,
            originX: 'left',
            originY: 'top',
          });
          break;
        case 'frame':
          shape = new fabric.Rect({
            left: px,
            top: py,
            width: 0,
            height: 0,
            fill: '#ffffff',
            stroke: '#d1d5db',
            strokeWidth: 1,
            opacity: 1,
            rx: 0,
            ry: 0,
            originX: 'left',
            originY: 'top',
          });
          break;
        case 'star': {
          const starPoints = createStarPoints(px, py, 5, 1, 0.5);
          shape = new fabric.Polygon(starPoints, {
            left: px,
            top: py,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity / 100,
            originX: 'left',
            originY: 'top',
          });
          break;
        }
        case 'polygon': {
          const polyPoints = createPolygonPoints(px, py, 6, 1);
          shape = new fabric.Polygon(polyPoints, {
            left: px,
            top: py,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity / 100,
            originX: 'left',
            originY: 'top',
          });
          break;
        }
      }

      if (shape) {
        const extShape = shape as ExtendedFabricObject;
        extShape.id = generateId();
        extShape.customName = activeTool === 'frame' ? 'Frame' : undefined;
        if (activeTool === 'frame') {
          extShape.isFrame = true;
        }
        tempShape.current = shape;
        canvas.add(shape);
        canvas.requestRenderAll();
      }
    };

    const handleMouseMove = (opt: fabric.TPointerEventInfo) => {
      const clientPos = getClientPos(opt.e);
      // Handle panning
      if (isPanning.current) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += clientPos.x - lastPanPoint.current.x;
          vpt[5] += clientPos.y - lastPanPoint.current.y;
          canvas.requestRenderAll();
        }
        lastPanPoint.current = clientPos;
        return;
      }

      if (!isDrawingShape.current || !tempShape.current) return;

      const pointer = canvas.getScenePoint(opt.e);
      const px = snapToGrid ? snapToGridValue(pointer.x, gridSize) : pointer.x;
      const py = snapToGrid ? snapToGridValue(pointer.y, gridSize) : pointer.y;

      const width = Math.abs(px - drawStart.current.x);
      const height = Math.abs(py - drawStart.current.y);
      const left = Math.min(px, drawStart.current.x);
      const top = Math.min(py, drawStart.current.y);

      if (tempShape.current instanceof fabric.Rect) {
        tempShape.current.set({ left, top, width, height });
      } else if (tempShape.current instanceof fabric.Ellipse) {
        tempShape.current.set({
          left,
          top,
          rx: width / 2,
          ry: height / 2,
        });
      } else if (tempShape.current instanceof fabric.Line) {
        tempShape.current.set({ x2: px, y2: py });
      } else if (tempShape.current instanceof fabric.Triangle) {
        tempShape.current.set({ left, top, width, height });
      } else if (tempShape.current instanceof fabric.Polygon) {
        // Recreate polygon/star with new size
        const radius = Math.max(width, height) / 2;
        const cx = drawStart.current.x;
        const cy = drawStart.current.y;
        let points;

        if (activeTool === 'star') {
          points = createStarPoints(cx, cy, 5, radius, radius * 0.4);
        } else {
          points = createPolygonPoints(cx, cy, 6, radius);
        }
        tempShape.current.set({ points });
      }

      tempShape.current.setCoords();
      canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (isPanning.current) {
        isPanning.current = false;
        if (activeTool === 'hand') {
          canvas.defaultCursor = 'grab';
        }
        return;
      }

      if (!isDrawingShape.current || !tempShape.current) return;

      isDrawingShape.current = false;

      // Remove if too small (accidental click)
      const obj = tempShape.current;
      if (obj instanceof fabric.Rect || obj instanceof fabric.Triangle) {
        if ((obj.width ?? 0) < 3 && (obj.height ?? 0) < 3) {
          // Set default size for click-to-create
          obj.set({ width: 100, height: 100 });
        }
      } else if (obj instanceof fabric.Ellipse) {
        if ((obj.rx ?? 0) < 3 && (obj.ry ?? 0) < 3) {
          obj.set({ rx: 50, ry: 50 });
        }
      }

      obj.setCoords();
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      saveHistory();
      tempShape.current = null;
      setActiveTool('select');
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [
    activeTool,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity,
    fontSize,
    fontFamily,
    cornerRadius,
    snapToGrid,
    gridSize,
    saveHistory,
    setActiveTool,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Don't handle shortcuts when editing text
      const activeObj = canvas.getActiveObject();
      if (activeObj && activeObj instanceof fabric.IText && (activeObj as fabric.IText).isEditing) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts (single key)
      if (!isCtrl && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            return;
          case 'h':
            setActiveTool('hand');
            return;
          case 'r':
            setActiveTool('rectangle');
            return;
          case 'o':
            setActiveTool('ellipse');
            return;
          case 'l':
            setActiveTool('line');
            return;
          case 't':
            setActiveTool('text');
            return;
          case 'p':
            setActiveTool('pencil');
            return;
          case 'f':
            setActiveTool('frame');
            return;
          case 'delete':
          case 'backspace':
            deleteSelected();
            return;
        }
      }

      // Ctrl shortcuts
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            e.preventDefault();
            return;
          case 'y':
            redo();
            e.preventDefault();
            return;
          case 'c':
            copySelected();
            e.preventDefault();
            return;
          case 'x':
            cutSelected();
            e.preventDefault();
            return;
          case 'v':
            pasteClipboard();
            e.preventDefault();
            return;
          case 'd':
            duplicateSelected();
            e.preventDefault();
            return;
          case 'a':
            selectAll();
            e.preventDefault();
            return;
          case 'g':
            if (e.shiftKey) {
              ungroupSelected();
            } else {
              groupSelected();
            }
            e.preventDefault();
            return;
          case ']':
            bringForward();
            e.preventDefault();
            return;
          case '[':
            sendBackward();
            e.preventDefault();
            return;
          case '/':
            useStore.getState().setShowShortcuts(!useStore.getState().showShortcuts);
            e.preventDefault();
            return;
        }
      }

      // Arrow keys for moving objects
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const active = canvas.getActiveObject();
        if (!active) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        switch (e.key) {
          case 'ArrowUp':
            active.set('top', (active.top ?? 0) - step);
            break;
          case 'ArrowDown':
            active.set('top', (active.top ?? 0) + step);
            break;
          case 'ArrowLeft':
            active.set('left', (active.left ?? 0) - step);
            break;
          case 'ArrowRight':
            active.set('left', (active.left ?? 0) + step);
            break;
        }
        active.setCoords();
        canvas.requestRenderAll();
        saveHistory();
      }

      // Space for hand tool
      if (e.key === ' ' && !isCtrl) {
        e.preventDefault();
        setActiveTool('hand');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [saveHistory, setActiveTool]);

  // Operations
  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    saveHistory();
  }, [saveHistory]);

  const copySelected = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    // Clone objects for clipboard so paste uses independent copies
    const clones: fabric.FabricObject[] = [];
    for (const obj of activeObjects) {
      const cloned = await obj.clone();
      // Preserve absolute position for single objects
      cloned.set({ left: obj.left, top: obj.top });
      clones.push(cloned);
    }
    clipboardRef.current = clones;
  }, []);

  const cutSelected = useCallback(async () => {
    await copySelected();
    deleteSelected();
  }, [copySelected, deleteSelected]);

  const pasteClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || clipboardRef.current.length === 0) return;

    canvas.discardActiveObject();
    const clonedObjects: fabric.FabricObject[] = [];

    for (const obj of clipboardRef.current) {
      const cloned = await obj.clone();
      cloned.set({
        left: (cloned.left ?? 0) + 20,
        top: (cloned.top ?? 0) + 20,
      });
      (cloned as ExtendedFabricObject).id = generateId();
      canvas.add(cloned);
      clonedObjects.push(cloned);
    }

    if (clonedObjects.length === 1) {
      canvas.setActiveObject(clonedObjects[0]);
    } else if (clonedObjects.length > 1) {
      const sel = new fabric.ActiveSelection(clonedObjects, { canvas });
      canvas.setActiveObject(sel);
    }

    canvas.requestRenderAll();
    saveHistory();
  }, [saveHistory]);

  const duplicateSelected = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    canvas.discardActiveObject();
    const clonedObjects: fabric.FabricObject[] = [];

    for (const obj of activeObjects) {
      const cloned = await obj.clone();
      cloned.set({
        left: (cloned.left ?? 0) + 20,
        top: (cloned.top ?? 0) + 20,
      });
      (cloned as ExtendedFabricObject).id = generateId();
      canvas.add(cloned);
      clonedObjects.push(cloned);
    }

    if (clonedObjects.length === 1) {
      canvas.setActiveObject(clonedObjects[0]);
    } else if (clonedObjects.length > 1) {
      const sel = new fabric.ActiveSelection(clonedObjects, { canvas });
      canvas.setActiveObject(sel);
    }

    canvas.requestRenderAll();
    saveHistory();
  }, [saveHistory]);

  const selectAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects().filter(
      (obj) => !(obj as ExtendedFabricObject).isGrid && obj.selectable !== false
    );
    if (objects.length === 0) return;
    const sel = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
  }, []);

  const groupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || !(activeObj instanceof fabric.ActiveSelection)) return;

    const objects = (activeObj as fabric.ActiveSelection).getObjects();
    canvas.discardActiveObject();
    const group = new fabric.Group(objects, {
      originX: 'left',
      originY: 'top',
    });
    objects.forEach((obj) => canvas.remove(obj));
    (group as ExtendedFabricObject).id = generateId();
    (group as ExtendedFabricObject).customName = 'Group';
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    saveHistory();
    syncLayers();
  }, [saveHistory, syncLayers]);

  const ungroupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || !(activeObj instanceof fabric.Group)) return;

    const items = (activeObj as fabric.Group).getObjects();

    // Children's left/top are relative to group center
    // Group center = group.left + group.width*scaleX/2, group.top + group.height*scaleY/2
    const groupCenterX = (activeObj.left ?? 0) + ((activeObj.width ?? 0) * (activeObj.scaleX ?? 1)) / 2;
    const groupCenterY = (activeObj.top ?? 0) + ((activeObj.height ?? 0) * (activeObj.scaleY ?? 1)) / 2;

    // Compute absolute positions for each child before removing the group
    const itemPositions = items.map((item) => ({
      item,
      left: groupCenterX + (item.left ?? 0),
      top: groupCenterY + (item.top ?? 0),
    }));

    // Remove the group from canvas
    canvas.remove(activeObj);
    canvas.discardActiveObject();

    // Remove all children from the group to clear their parent reference
    // Without this, items still reference the old group as parent and
    // calcTransformMatrix() during rendering applies the group transform again
    (activeObj as fabric.Group).removeAll();

    itemPositions.forEach(({ item, left, top }) => {
      item.set({ left, top });
      item.setCoords();
      canvas.add(item);
    });

    // Do NOT create an ActiveSelection here — it re-adjusts children positions
    canvas.requestRenderAll();
    saveHistory();
    syncLayers();
  }, [saveHistory, syncLayers]);

  const bringForward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringObjectForward(active);
    canvas.requestRenderAll();
    saveHistory();
    syncLayers();
  }, [saveHistory, syncLayers]);

  const sendBackward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendObjectBackwards(active);
    canvas.requestRenderAll();
    saveHistory();
    syncLayers();
  }, [saveHistory, syncLayers]);

  const bringToFront = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringObjectToFront(active);
    canvas.requestRenderAll();
    saveHistory();
    syncLayers();
  }, [saveHistory, syncLayers]);

  const sendToBack = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendObjectToBack(active);
    canvas.requestRenderAll();
    saveHistory();
    syncLayers();
  }, [saveHistory, syncLayers]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { history, historyIndex } = useStore.getState();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    setHistoryIndex(newIndex);

    canvas.loadFromJSON(JSON.parse(entry.json)).then(() => {
      canvas.requestRenderAll();
      syncLayers();
    });
  }, [setHistoryIndex, syncLayers]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { history, historyIndex } = useStore.getState();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    setHistoryIndex(newIndex);

    canvas.loadFromJSON(JSON.parse(entry.json)).then(() => {
      canvas.requestRenderAll();
      syncLayers();
    });
  }, [setHistoryIndex, syncLayers]);

  const exportCanvas = useCallback(
    (format: 'png' | 'svg' | 'jpg', scale: number = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Temporarily remove grid
      const gridObjects = canvas.getObjects().filter(
        (obj) => (obj as ExtendedFabricObject).isGrid
      );
      gridObjects.forEach((obj) => (obj.visible = false));
      canvas.requestRenderAll();

      if (format === 'svg') {
        const svg = canvas.toSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vigma-export.svg';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const dataUrl = canvas.toDataURL({
          format: format === 'jpg' ? 'jpeg' : 'png',
          quality: 1,
          multiplier: scale,
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `vigma-export.${format}`;
        a.click();
      }

      // Restore grid
      gridObjects.forEach((obj) => (obj.visible = true));
      canvas.requestRenderAll();
    },
    []
  );

  const importImage = useCallback(
    (file: File) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const imgEl = new Image();
        imgEl.onload = () => {
          const fabricImg = new fabric.FabricImage(imgEl, {
            left: 100,
            top: 100,
            originX: 'left',
            originY: 'top',
          });
          // Scale down large images
          const maxDim = 500;
          if (imgEl.width > maxDim || imgEl.height > maxDim) {
            const scaleFactor = maxDim / Math.max(imgEl.width, imgEl.height);
            fabricImg.scale(scaleFactor);
          }
          (fabricImg as ExtendedFabricObject).id = generateId();
          (fabricImg as ExtendedFabricObject).customName = file.name;
          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.requestRenderAll();
          saveHistory();
        };
        imgEl.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [saveHistory]
  );

  const setObjectProperty = useCallback(
    (property: string, value: unknown) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 0) return;

      activeObjects.forEach((obj) => {
        obj.set(property as keyof fabric.FabricObject, value as never);
        obj.setCoords();
      });
      canvas.requestRenderAll();
      saveHistory();
    },
    [saveHistory]
  );

  const getActiveObjectProps = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const active = canvas.getActiveObject();
    if (!active) return null;

    return {
      left: Math.round(active.left ?? 0),
      top: Math.round(active.top ?? 0),
      width: Math.round((active.width ?? 0) * (active.scaleX ?? 1)),
      height: Math.round((active.height ?? 0) * (active.scaleY ?? 1)),
      baseWidth: active.width ?? 0,
      baseHeight: active.height ?? 0,
      scaleX: active.scaleX ?? 1,
      scaleY: active.scaleY ?? 1,
      angle: Math.round(active.angle ?? 0),
      opacity: Math.round((active.opacity ?? 1) * 100),
      fill: (active.fill as string) || '#000000',
      stroke: (active.stroke as string) || '',
      strokeWidth: active.strokeWidth ?? 0,
      rx: (active as fabric.Rect).rx ?? 0,
      ry: (active as fabric.Rect).ry ?? 0,
      fontSize: (active as fabric.IText).fontSize ?? 24,
      fontFamily: (active as fabric.IText).fontFamily ?? 'Inter',
      fontWeight: (active as fabric.IText).fontWeight ?? 'normal',
      fontStyle: (active as fabric.IText).fontStyle ?? 'normal',
      textAlign: (active as fabric.IText).textAlign ?? 'left',
      type: active.type,
      id: (active as ExtendedFabricObject).id,
      name: (active as ExtendedFabricObject).customName || getObjectName(active),
    };
  }, []);

  const selectObjectById = useCallback((id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(
      (o) => (o as ExtendedFabricObject).id === id
    );
    if (obj) {
      canvas.discardActiveObject();
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    }
  }, []);

  const toggleLayerVisibility = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find(
        (o) => (o as ExtendedFabricObject).id === id
      );
      if (obj) {
        obj.set('visible', !obj.visible);
        canvas.requestRenderAll();
        syncLayers();
      }
    },
    [syncLayers]
  );

  const toggleLayerLock = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find(
        (o) => (o as ExtendedFabricObject).id === id
      );
      if (obj) {
        const isLocked = !obj.selectable;
        obj.set({
          selectable: isLocked,
          evented: isLocked,
        });
        canvas.requestRenderAll();
        syncLayers();
      }
    },
    [syncLayers]
  );

  const renameLayer = useCallback(
    (id: string, name: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find(
        (o) => (o as ExtendedFabricObject).id === id
      );
      if (obj) {
        (obj as ExtendedFabricObject).customName = name;
        syncLayers();
      }
    },
    [syncLayers]
  );

  const zoomTo = useCallback(
    (level: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const center = canvas.getCenterPoint();
      canvas.zoomToPoint(center, level / 100);
      setZoom(level);
    },
    [setZoom]
  );

  const zoomToFit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects().filter(
      (obj) => !(obj as ExtendedFabricObject).isGrid
    );
    if (objects.length === 0) return;

    // Calculate bounding rect of all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach((obj) => {
      const rect = obj.getBoundingRect();
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.left + rect.width);
      maxY = Math.max(maxY, rect.top + rect.height);
    });
    const bound = { left: minX, top: minY, width: maxX - minX, height: maxY - minY };

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const scaleX = (canvasWidth * 0.8) / bound.width;
    const scaleY = (canvasHeight * 0.8) / bound.height;
    const scale = Math.min(scaleX, scaleY, 1);

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.zoomToPoint(
      new fabric.Point(canvasWidth / 2, canvasHeight / 2),
      scale
    );

    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] = canvasWidth / 2 - (bound.left + bound.width / 2) * scale;
      vpt[5] = canvasHeight / 2 - (bound.top + bound.height / 2) * scale;
    }

    setZoom(Math.round(scale * 100));
    canvas.requestRenderAll();
  }, [setZoom]);

  return {
    canvasRef,
    initCanvas,
    deleteSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    duplicateSelected,
    selectAll,
    groupSelected,
    ungroupSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    undo,
    redo,
    exportCanvas,
    importImage,
    setObjectProperty,
    getActiveObjectProps,
    selectObjectById,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    zoomTo,
    zoomToFit,
    saveHistory,
    syncLayers,
  };
}
