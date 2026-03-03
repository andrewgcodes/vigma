import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Canvas, Rect, Ellipse, Triangle, Line, Textbox, PencilBrush,
  FabricObject, Point, Polygon, FabricImage, Group, Shadow, ActiveSelection,
} from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../../store/canvasStore';
import { ToolType, ContextMenuOption, LayerInfo } from '../../types';
import {
  DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH,
  LINE_STROKE, LINE_STROKE_WIDTH, ARTBOARD_WIDTH, ARTBOARD_HEIGHT,
  GRID_SIZE, GRID_COLOR, PRIMARY_COLOR,
} from '../../utils/defaultStyles';
import { getCanvasObjects, getNextObjectName, createStarPoints, resetObjectCounters } from '../../utils/canvasHelpers';
import { serializeCanvas } from '../../utils/historyHelpers';
import WelcomeOverlay from './WelcomeOverlay';
import ContextMenu from '../ContextMenu/ContextMenu';

// Extend FabricObject with custom properties
declare module 'fabric' {
  interface FabricObject {
    customId?: string;
    customType?: string;
    locked?: boolean;
  }
  interface SerializedObjectProps {
    customId?: string;
    customType?: string;
    locked?: boolean;
  }
}

export interface CanvasAreaHandle {
  zoomTo: (zoom: number) => void;
  getCanvas: () => Canvas | null;
  getLayers: () => LayerInfo[];
  selectObjectById: (id: string) => void;
  toggleObjectVisibility: (id: string) => void;
  toggleObjectLock: (id: string) => void;
  renameObject: (id: string, name: string) => void;
  reorderObject: (fromId: string, toId: string) => void;
  addRectangleAtRandom: () => void;
  getSelectedObjects: () => FabricObject[];
  setObjectProperty: (prop: string, value: unknown) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  selectAll: () => void;
  triggerImageUpload: () => void;
  triggerJSONImport: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  zoomToFit: () => void;
}

interface CanvasAreaProps {
  onLayersChange: () => void;
  onSelectionChange: (objects: FabricObject[]) => void;
  onContextMenu: (x: number, y: number, options: ContextMenuOption[]) => void;
}

const CanvasArea = forwardRef<CanvasAreaHandle, CanvasAreaProps>(({ onLayersChange, onSelectionChange, onContextMenu }, ref) => {
  const canvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const { state, dispatch, setTool, setZoom, pushHistory, setSelected, showToast, setClipboard } = useAppContext();
  const [showWelcome, setShowWelcome] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; options: ContextMenuOption[] } | null>(null);

  const isDrawingRef = useRef(false);
  const drawStartRef = useRef({ x: 0, y: 0 });
  const activeShapeRef = useRef<FabricObject | null>(null);
  const isPanningRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const prevToolRef = useRef<ToolType>('select');
  const historyPauseRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const layersChangedRef = useRef(onLayersChange);
  const selectionChangedRef = useRef(onSelectionChange);

  layersChangedRef.current = onLayersChange;
  selectionChangedRef.current = onSelectionChange;

  const saveHistory = useCallback(() => {
    if (historyPauseRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const json = serializeCanvas(canvas);
    pushHistory(json);
  }, [pushHistory]);

  const notifyLayersChanged = useCallback(() => {
    layersChangedRef.current();
  }, []);

  const notifySelectionChanged = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjs = canvas.getActiveObjects();
    selectionChangedRef.current(activeObjs);
    const ids = activeObjs.map((o) => o.customId).filter(Boolean) as string[];
    setSelected(ids);
  }, [setSelected]);

  const assignCustomProps = useCallback((obj: FabricObject, type: string, name?: string) => {
    obj.customId = uuidv4();
    obj.customType = type;
    (obj as FabricObject & { name?: string }).name = name || getNextObjectName(type);
    obj.set({
      cornerColor: PRIMARY_COLOR,
      cornerStyle: 'circle',
      borderColor: PRIMARY_COLOR,
      transparentCorners: false,
      cornerSize: 8,
    });
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const canvas = new Canvas('fabric-canvas', {
      width,
      height,
      backgroundColor: '#1a1a1a',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: false,
    });

    // Register custom properties for serialization
    const customProps = ['customId', 'customType', 'locked', 'name'];
    customProps.forEach(prop => {
      if (!FabricObject.customProperties.includes(prop)) {
        FabricObject.customProperties.push(prop);
      }
    });

    canvasRef.current = canvas;

    // Add artboard
    const artboard = new Rect({
      left: (width - ARTBOARD_WIDTH) / 2,
      top: (height - ARTBOARD_HEIGHT) / 2,
      width: ARTBOARD_WIDTH,
      height: ARTBOARD_HEIGHT,
      fill: '#ffffff',
      selectable: false,
      evented: false,
    });
    (artboard as FabricObject & { name?: string }).name = 'artboard';
    artboard.customId = 'artboard';
    artboard.customType = 'artboard';
    canvas.add(artboard);
    canvas.requestRenderAll();

    // Try load from localStorage
    try {
      const saved = localStorage.getItem('vigma-autosave');
      if (saved) {
        const parsed = JSON.parse(saved);
        historyPauseRef.current = true;
        canvas.loadFromJSON(parsed).then(() => {
          canvas.requestRenderAll();
          historyPauseRef.current = false;
          setShowWelcome(false);
          showToast('Previous design restored');
          notifyLayersChanged();
          saveHistory();
        }).catch(() => {
          localStorage.removeItem('vigma-autosave');
          historyPauseRef.current = false;
          saveHistory();
        });
      } else {
        saveHistory();
      }
    } catch {
      localStorage.removeItem('vigma-autosave');
      saveHistory();
    }

    dispatch({ type: 'SET_CANVAS_READY' });

    // Auto-save
    autoSaveTimerRef.current = setInterval(() => {
      try {
        const json = JSON.stringify(canvas.toObject(['customId', 'name', 'selectable', 'evented', 'customType', 'locked']));
        localStorage.setItem('vigma-autosave', json);
      } catch { /* ignore */ }
    }, 5000);

    // Selection events
    canvas.on('selection:created', () => {
      notifySelectionChanged();
    });
    canvas.on('selection:updated', () => {
      notifySelectionChanged();
    });
    canvas.on('selection:cleared', () => {
      notifySelectionChanged();
    });

    // Object modified
    canvas.on('object:modified', () => {
      saveHistory();
      notifyLayersChanged();
      notifySelectionChanged();
    });

    // Mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent;
      const delta = e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(zoom, 0.1), 5);
      canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom);
      e.preventDefault();
      e.stopPropagation();
      setZoom(zoom);
    });

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      canvas.requestRenderAll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle tool changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tool = state.activeTool;

    // Reset drawing mode
    canvas.isDrawingMode = false;
    canvas.selection = tool === 'select';
    canvas.defaultCursor = 'default';

    if (tool === 'hand') {
      canvas.defaultCursor = 'grab';
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        if ((obj as FabricObject & { name?: string }).name !== 'artboard') {
          obj.selectable = !obj.locked;
        }
      });
    } else if (tool === 'pencil') {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.color = '#ffffff';
      brush.width = 2;
      canvas.freeDrawingBrush = brush;
    } else if (tool === 'text') {
      canvas.defaultCursor = 'text';
      canvas.selection = false;
    } else if (tool === 'select') {
      canvas.defaultCursor = 'default';
      canvas.forEachObject((obj) => {
        if ((obj as FabricObject & { name?: string }).name !== 'artboard') {
          obj.selectable = !obj.locked;
          obj.evented = true;
        }
      });
    } else {
      // Shape tools
      canvas.defaultCursor = 'crosshair';
      canvas.selection = false;
    }

    canvas.requestRenderAll();
  }, [state.activeTool]);

  // Handle mouse events for shape drawing, panning, text
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: { e: MouseEvent | TouchEvent; }) => {
      const e = opt.e as MouseEvent;
      const tool = state.activeTool;
      const pointer = canvas.getScenePoint(e);

      // Handle panning
      if (tool === 'hand' || spaceHeldRef.current) {
        isPanningRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        canvas.defaultCursor = 'grabbing';
        return;
      }

      // Middle mouse pan
      if (e.button === 1) {
        isPanningRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Text tool
      if (tool === 'text') {
        const text = new Textbox('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 24,
          fontFamily: 'Inter',
          fill: '#333333',
          width: 200,
          editable: true,
        });
        assignCustomProps(text, 'text');
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.requestRenderAll();
        text.enterEditing();
        setShowWelcome(false);
        saveHistory();
        notifyLayersChanged();
        setTool('select');
        return;
      }

      // Shape drawing
      if (['rectangle', 'ellipse', 'triangle', 'line', 'arrow', 'star'].includes(tool)) {
        isDrawingRef.current = true;
        drawStartRef.current = { x: pointer.x, y: pointer.y };

        let shape: FabricObject;

        if (tool === 'rectangle') {
          shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
          });
        } else if (tool === 'ellipse') {
          shape = new Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 0,
            ry: 0,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
          });
        } else if (tool === 'triangle') {
          shape = new Triangle({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
          });
        } else if (tool === 'line' || tool === 'arrow') {
          shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: LINE_STROKE,
            strokeWidth: LINE_STROKE_WIDTH,
            fill: '',
          });
        } else {
          // star - placeholder, will be finalized on mouseUp
          shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            opacity: 0.5,
          });
        }

        assignCustomProps(shape, tool);
        canvas.add(shape);
        activeShapeRef.current = shape;
        canvas.requestRenderAll();
        setShowWelcome(false);
      }
    };

    const handleMouseMove = (opt: { e: MouseEvent | TouchEvent; }) => {
      const e = opt.e as MouseEvent;

      // Panning
      if (isPanningRef.current) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosRef.current.x;
          vpt[5] += e.clientY - lastPosRef.current.y;
          canvas.requestRenderAll();
          lastPosRef.current = { x: e.clientX, y: e.clientY };
        }
        return;
      }

      // Shape drawing
      if (isDrawingRef.current && activeShapeRef.current) {
        const pointer = canvas.getScenePoint(e);
        const start = drawStartRef.current;
        let width = pointer.x - start.x;
        let height = pointer.y - start.y;
        const tool = state.activeTool;

        // Shift constraint
        if (e.shiftKey && tool !== 'line' && tool !== 'arrow') {
          const size = Math.max(Math.abs(width), Math.abs(height));
          width = width < 0 ? -size : size;
          height = height < 0 ? -size : size;
        }

        if (tool === 'ellipse') {
          (activeShapeRef.current as Ellipse).set({
            rx: Math.abs(width) / 2,
            ry: Math.abs(height) / 2,
            left: width < 0 ? start.x + width : start.x,
            top: height < 0 ? start.y + height : start.y,
          });
        } else if (tool === 'line' || tool === 'arrow') {
          let endX = pointer.x;
          let endY = pointer.y;
          if (e.shiftKey) {
            const dx = endX - start.x;
            const dy = endY - start.y;
            const angle = Math.atan2(dy, dx);
            const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const length = Math.sqrt(dx * dx + dy * dy);
            endX = start.x + length * Math.cos(snappedAngle);
            endY = start.y + length * Math.sin(snappedAngle);
          }
          (activeShapeRef.current as Line).set({
            x2: endX,
            y2: endY,
          });
        } else {
          activeShapeRef.current.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width < 0 ? start.x + width : start.x,
            top: height < 0 ? start.y + height : start.y,
          });
        }
        canvas.requestRenderAll();
      }
    };

    const handleMouseUp = () => {
      // End panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        if (state.activeTool === 'hand' || spaceHeldRef.current) {
          canvas.defaultCursor = 'grab';
        }
        return;
      }

      // Finalize shape
      if (isDrawingRef.current && activeShapeRef.current) {
        isDrawingRef.current = false;
        const shape = activeShapeRef.current;
        const tool = state.activeTool;

        // Check for zero-size shapes
        if (tool === 'line' || tool === 'arrow') {
          const line = shape as Line;
          const dx = (line.x2 ?? 0) - (line.x1 ?? 0);
          const dy = (line.y2 ?? 0) - (line.y1 ?? 0);
          if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
            canvas.remove(shape);
            activeShapeRef.current = null;
            canvas.requestRenderAll();
            return;
          }
        } else {
          const w = shape.width ?? 0;
          const h = shape.height ?? 0;
          if (w < 2 && h < 2) {
            canvas.remove(shape);
            activeShapeRef.current = null;
            canvas.requestRenderAll();
            return;
          }
        }

        // Replace star placeholder with actual star
        if (tool === 'star') {
          const left = shape.left ?? 0;
          const top = shape.top ?? 0;
          const w = shape.width ?? 0;
          const h = shape.height ?? 0;
          canvas.remove(shape);

          const outerR = Math.min(w, h) / 2;
          const innerR = outerR * 0.4;
          const points = createStarPoints(0, 0, outerR, innerR, 5);
          const star = new Polygon(points.map(p => new Point(p.x, p.y)), {
            left: left + w / 2,
            top: top + h / 2,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            originX: 'center',
            originY: 'center',
          });
          assignCustomProps(star, 'star');
          canvas.add(star);
          canvas.setActiveObject(star);
        } else if (tool === 'arrow') {
          // Add arrowhead - keep the line and note it's an arrow type
          shape.customType = 'arrow';
        }

        if (tool !== 'star') {
          canvas.setActiveObject(shape);
        }

        activeShapeRef.current = null;
        canvas.requestRenderAll();
        saveHistory();
        notifyLayersChanged();
        setTool('select');
      }
    };

    // Pencil path created
    const handlePathCreated = (opt: { path: FabricObject }) => {
      const path = opt.path;
      assignCustomProps(path, 'pencil');
      canvas.requestRenderAll();
      setShowWelcome(false);
      saveHistory();
      notifyLayersChanged();
    };

    canvas.on('mouse:down', handleMouseDown as (opt: unknown) => void);
    canvas.on('mouse:move', handleMouseMove as (opt: unknown) => void);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('path:created', handlePathCreated as (opt: unknown) => void);

    return () => {
      canvas.off('mouse:down', handleMouseDown as (opt: unknown) => void);
      canvas.off('mouse:move', handleMouseMove as (opt: unknown) => void);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('path:created', handlePathCreated as (opt: unknown) => void);
    };
  }, [state.activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle undo/redo
  const lastAppliedIndexRef = useRef<number>(-1);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.history.length === 0 || state.historyIndex < 0) return;
    // Only apply if historyIndex actually changed due to undo/redo
    if (lastAppliedIndexRef.current === state.historyIndex) return;
    // Skip if this is a new history push (index is at the end)
    if (state.historyIndex === state.history.length - 1 && lastAppliedIndexRef.current === state.historyIndex - 1) {
      lastAppliedIndexRef.current = state.historyIndex;
      return;
    }
    lastAppliedIndexRef.current = state.historyIndex;
    const currentState = state.history[state.historyIndex];
    if (!currentState) return;

    historyPauseRef.current = true;
    try {
      const parsed = JSON.parse(currentState);
      canvas.loadFromJSON(parsed).then(() => {
        canvas.requestRenderAll();
        historyPauseRef.current = false;
        notifyLayersChanged();
        notifySelectionChanged();
      }).catch(() => {
        historyPauseRef.current = false;
      });
    } catch {
      historyPauseRef.current = false;
    }
  }, [state.historyIndex, state.history.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Don't fire shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      // Check if editing text on canvas
      const activeObj = canvas.getActiveObject();
      if (activeObj && activeObj instanceof Textbox && (activeObj as Textbox).isEditing) {
        if (e.key === 'Escape') {
          (activeObj as Textbox).exitEditing();
          canvas.requestRenderAll();
        }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Space for temp pan
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        prevToolRef.current = state.activeTool;
        canvas.defaultCursor = 'grab';
        canvas.selection = false;
        return;
      }

      // Tool shortcuts (single key, no modifiers)
      if (!ctrl && !e.shiftKey && !e.altKey) {
        const toolMap: Record<string, ToolType> = {
          'v': 'select', 'h': 'hand', 'r': 'rectangle', 'o': 'ellipse',
          't': 'triangle', 'l': 'line', 'a': 'arrow', 's': 'star',
          'x': 'text', 'p': 'pencil',
        };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) {
          setTool(tool);
          return;
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedObjects();
        return;
      }

      // Ctrl shortcuts
      if (ctrl) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          dispatch({ type: 'UNDO' });
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          dispatch({ type: 'REDO' });
          return;
        }
        if (e.key === 'c') {
          e.preventDefault();
          copySelectedObjects();
          return;
        }
        if (e.key === 'v') {
          e.preventDefault();
          pasteFromClipboard();
          return;
        }
        if (e.key === 'd') {
          e.preventDefault();
          duplicateSelectedObjects();
          return;
        }
        if (e.key === 'a') {
          e.preventDefault();
          selectAllObjects();
          return;
        }
        if (e.key === 'g' && !e.shiftKey) {
          e.preventDefault();
          groupSelectedObjects();
          return;
        }
        if (e.key === 'g' && e.shiftKey) {
          e.preventDefault();
          ungroupSelectedObjects();
          return;
        }
        if (e.key === "'" || e.key === '`') {
          e.preventDefault();
          dispatch({ type: 'TOGGLE_GRID' });
          return;
        }
        if (e.key === 'e' && e.shiftKey) {
          e.preventDefault();
          dispatch({ type: 'SHOW_EXPORT_MODAL' });
          return;
        }
        if (e.key === ']') {
          e.preventDefault();
          bringToFrontAction();
          return;
        }
        if (e.key === '[') {
          e.preventDefault();
          sendToBackAction();
          return;
        }
        if (e.key === '0') {
          e.preventDefault();
          zoomToLevel(1);
          return;
        }
        if (e.key === '1') {
          e.preventDefault();
          zoomToFitAction();
          return;
        }
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomToLevel(Math.min(5, canvas.getZoom() + 0.1));
          return;
        }
        if (e.key === '-') {
          e.preventDefault();
          zoomToLevel(Math.max(0.1, canvas.getZoom() - 0.1));
          return;
        }
        if (e.key === 'Delete' && e.shiftKey) {
          e.preventDefault();
          if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            canvas.clear();
            canvas.backgroundColor = '#1a1a1a';
            // Re-add artboard
            const artboard = new Rect({
              left: (canvas.width! - ARTBOARD_WIDTH) / 2,
              top: (canvas.height! - ARTBOARD_HEIGHT) / 2,
              width: ARTBOARD_WIDTH,
              height: ARTBOARD_HEIGHT,
              fill: '#ffffff',
              selectable: false,
              evented: false,
            });
            (artboard as FabricObject & { name?: string }).name = 'artboard';
            artboard.customId = 'artboard';
            artboard.customType = 'artboard';
            canvas.add(artboard);
            canvas.requestRenderAll();
            localStorage.removeItem('vigma-autosave');
            saveHistory();
            notifyLayersChanged();
            notifySelectionChanged();
            showToast('Canvas cleared');
          }
          return;
        }
      }

      // Z-order shortcuts without ctrl
      if (e.key === ']' && !ctrl) {
        e.preventDefault();
        bringForwardAction();
        return;
      }
      if (e.key === '[' && !ctrl) {
        e.preventDefault();
        sendBackwardAction();
        return;
      }

      // Zoom shortcuts
      if ((e.key === '+' || e.key === '=') && !ctrl) {
        e.preventDefault();
        zoomToLevel(Math.min(5, (canvasRef.current?.getZoom() ?? 1) + 0.1));
        return;
      }
      if (e.key === '-' && !ctrl) {
        e.preventDefault();
        zoomToLevel(Math.max(0.1, (canvasRef.current?.getZoom() ?? 1) - 0.1));
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceHeldRef.current = false;
        isPanningRef.current = false;
        const canvas = canvasRef.current;
        if (canvas) {
          if (prevToolRef.current === 'select') {
            canvas.defaultCursor = 'default';
            canvas.selection = true;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.activeTool, state.clipboard]); // eslint-disable-line react-hooks/exhaustive-deps

  // Context menu on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextMenu = (opt: { e: MouseEvent | TouchEvent; }) => {
      const e = opt.e as MouseEvent;
      e.preventDefault();
      e.stopPropagation();

      const target = canvas.findTarget(e);
      const pointer = { x: e.clientX, y: e.clientY };

      if (target && (target as FabricObject & { name?: string }).name !== 'artboard') {
        // Right-click on object
        if (!target.locked) {
          canvas.setActiveObject(target);
          canvas.requestRenderAll();
          notifySelectionChanged();
        }

        const activeObjs = canvas.getActiveObjects();
        const hasMultiple = activeObjs.length > 1;
        const isGroup = target.type === 'group';

        const options: ContextMenuOption[] = [
          { label: 'Cut', shortcut: 'Ctrl+X', action: () => { copySelectedObjects(); deleteSelectedObjects(); } },
          { label: 'Copy', shortcut: 'Ctrl+C', action: () => copySelectedObjects() },
          { label: 'Paste', shortcut: 'Ctrl+V', action: () => pasteFromClipboard(), disabled: !state.clipboard },
          { label: '', separator: true, action: () => {} },
          { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => duplicateSelectedObjects() },
          { label: 'Delete', shortcut: 'Del', action: () => deleteSelectedObjects() },
          { label: '', separator: true, action: () => {} },
          { label: 'Bring to Front', shortcut: 'Ctrl+]', action: () => bringToFrontAction() },
          { label: 'Bring Forward', shortcut: ']', action: () => bringForwardAction() },
          { label: 'Send Backward', shortcut: '[', action: () => sendBackwardAction() },
          { label: 'Send to Back', shortcut: 'Ctrl+[', action: () => sendToBackAction() },
          { label: '', separator: true, action: () => {} },
          ...(hasMultiple ? [{ label: 'Group', shortcut: 'Ctrl+G', action: () => groupSelectedObjects() }] : []),
          ...(isGroup ? [{ label: 'Ungroup', shortcut: 'Ctrl+Shift+G', action: () => ungroupSelectedObjects() }] : []),
          ...((hasMultiple || isGroup) ? [{ label: '', separator: true, action: () => {} }] : []),
          { label: target.locked ? 'Unlock' : 'Lock', action: () => toggleObjectLockById(target.customId!) },
        ];

        setContextMenu({ x: pointer.x, y: pointer.y, options });
      } else {
        // Right-click on empty canvas
        const options: ContextMenuOption[] = [
          { label: 'Paste', shortcut: 'Ctrl+V', action: () => pasteFromClipboard(), disabled: !state.clipboard },
          { label: 'Select All', shortcut: 'Ctrl+A', action: () => selectAllObjects() },
          { label: '', separator: true, action: () => {} },
          { label: 'Toggle Grid', shortcut: "Ctrl+'", action: () => dispatch({ type: 'TOGGLE_GRID' }) },
          { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: () => zoomToLevel(1) },
          { label: 'Zoom to Fit', shortcut: 'Ctrl+1', action: () => zoomToFitAction() },
        ];
        setContextMenu({ x: pointer.x, y: pointer.y, options });
      }
    };

    const contextMenuHandler = (opt: { e: MouseEvent | TouchEvent }) => {
      const e = opt.e as MouseEvent;
      if (e.button === 2) {
        handleContextMenu(opt);
      }
    };
    canvas.on('mouse:down', contextMenuHandler as (opt: unknown) => void);

    // Disable browser context menu on canvas
    const canvasEl = canvas.getSelectionElement();
    const preventContext = (e: Event) => e.preventDefault();
    canvasEl.addEventListener('contextmenu', preventContext);

    return () => {
      canvas.off('mouse:down', contextMenuHandler as (opt: unknown) => void);
      canvasEl.removeEventListener('contextmenu', preventContext);
    };
  }, [state.clipboard]); // eslint-disable-line react-hooks/exhaustive-deps

  // Grid effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Remove existing grid lines
    const gridObjects = canvas.getObjects().filter((obj) => (obj as FabricObject & { name?: string }).name === 'grid');
    gridObjects.forEach((obj) => canvas.remove(obj));

    if (state.gridEnabled) {
      const width = canvas.width ?? 1200;
      const height = canvas.height ?? 800;
      const zoom = canvas.getZoom();
      const gridSize = GRID_SIZE;

      for (let x = 0; x < width / zoom + gridSize; x += gridSize) {
        const line = new Line([x, 0, x, height / zoom + gridSize], {
          stroke: GRID_COLOR,
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        (line as FabricObject & { name?: string }).name = 'grid';
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }
      for (let y = 0; y < height / zoom + gridSize; y += gridSize) {
        const line = new Line([0, y, width / zoom + gridSize, y], {
          stroke: GRID_COLOR,
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        (line as FabricObject & { name?: string }).name = 'grid';
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }
    }

    canvas.requestRenderAll();
  }, [state.gridEnabled]);

  // Helper functions
  const deleteSelectedObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjs = canvas.getActiveObjects();
    if (activeObjs.length === 0) return;
    activeObjs.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    saveHistory();
    notifyLayersChanged();
    notifySelectionChanged();
  };

  const copySelectedObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjs = canvas.getActiveObjects();
    if (activeObjs.length === 0) return;
    const serialized = activeObjs.map((obj) => obj.toObject(['customId', 'customType', 'locked', 'name']));
    setClipboard(serialized);
    showToast('Copied');
  };

  const pasteFromClipboard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !state.clipboard) return;

    canvas.discardActiveObject();
    const newObjects: FabricObject[] = [];

    const promises = state.clipboard.map((data) => {
      const cloneData = { ...data, left: ((data.left as number) || 0) + 20, top: ((data.top as number) || 0) + 20 };
      return FabricObject.fromObject(cloneData as Record<string, unknown>).then((rawObj) => {
        const obj = rawObj as unknown as FabricObject;
        obj.customId = uuidv4();
        canvas.add(obj);
        newObjects.push(obj);
      });
    });

    Promise.all(promises).then(() => {
      if (newObjects.length === 1) {
        canvas.setActiveObject(newObjects[0]);
      } else if (newObjects.length > 1) {
        const sel = new ActiveSelection(newObjects, { canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      saveHistory();
      notifyLayersChanged();
      notifySelectionChanged();
      showToast('Pasted');
    });
  };

  const duplicateSelectedObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjs = canvas.getActiveObjects();
    if (activeObjs.length === 0) return;

    canvas.discardActiveObject();
    const newObjects: FabricObject[] = [];

    const promises = activeObjs.map((obj) => {
      return obj.clone().then((cloned: FabricObject) => {
        cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
        cloned.customId = uuidv4();
        canvas.add(cloned);
        newObjects.push(cloned);
      });
    });

    Promise.all(promises).then(() => {
      if (newObjects.length === 1) {
        canvas.setActiveObject(newObjects[0]);
      } else if (newObjects.length > 1) {
        const sel = new ActiveSelection(newObjects, { canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      saveHistory();
      notifyLayersChanged();
      notifySelectionChanged();
    });
  };

  const selectAllObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = getCanvasObjects(canvas).filter((obj) => !obj.locked);
    if (objects.length === 0) return;
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0]);
    } else {
      const sel = new ActiveSelection(objects, { canvas });
      canvas.setActiveObject(sel);
    }
    canvas.requestRenderAll();
    notifySelectionChanged();
  };

  const groupSelectedObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjs = canvas.getActiveObjects();
    if (activeObjs.length < 2) return;

    const group = new Group(activeObjs, {});
    activeObjs.forEach((obj) => canvas.remove(obj));
    assignCustomProps(group, 'group');
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    saveHistory();
    notifyLayersChanged();
    notifySelectionChanged();
  };

  const ungroupSelectedObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'group') return;
    const group = active as Group;
    const items = group.removeAll();
    canvas.remove(group);
    items.forEach((obj) => canvas.add(obj));
    canvas.discardActiveObject();
    if (items.length > 0) {
      const sel = new ActiveSelection(items as FabricObject[], { canvas });
      canvas.setActiveObject(sel);
    }
    canvas.requestRenderAll();
    saveHistory();
    notifyLayersChanged();
    notifySelectionChanged();
  };

  const bringToFrontAction = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringObjectToFront(active);
    canvas.requestRenderAll();
    saveHistory();
    notifyLayersChanged();
  };

  const sendToBackAction = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    // Don't send behind artboard
    const artboard = canvas.getObjects().find((o) => (o as FabricObject & { name?: string }).name === 'artboard');
    canvas.sendObjectToBack(active);
    if (artboard) canvas.sendObjectToBack(artboard);
    canvas.requestRenderAll();
    saveHistory();
    notifyLayersChanged();
  };

  const bringForwardAction = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringObjectForward(active);
    canvas.requestRenderAll();
    saveHistory();
    notifyLayersChanged();
  };

  const sendBackwardAction = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendObjectBackwards(active);
    // Don't send behind artboard
    const objects = canvas.getObjects();
    const artboardIdx = objects.findIndex((o) => (o as FabricObject & { name?: string }).name === 'artboard');
    const activeIdx = objects.indexOf(active);
    if (activeIdx <= artboardIdx) {
      canvas.bringObjectForward(active);
    }
    canvas.requestRenderAll();
    saveHistory();
    notifyLayersChanged();
  };

  const zoomToLevel = (level: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(new Point(center.x, center.y), level);
    setZoom(level);
    canvas.requestRenderAll();
  };

  const zoomToFitAction = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = getCanvasObjects(canvas);
    if (objects.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach((obj) => {
      const rect = obj.getBoundingRect();
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.left + rect.width);
      maxY = Math.max(maxY, rect.top + rect.height);
    });

    const objWidth = maxX - minX;
    const objHeight = maxY - minY;
    const canvasWidth = canvas.width ?? 800;
    const canvasHeight = canvas.height ?? 600;

    const zoom = Math.min(canvasWidth / (objWidth + 100), canvasHeight / (objHeight + 100), 5);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const center = new Point((minX + maxX) / 2, (minY + maxY) / 2);
    canvas.zoomToPoint(new Point(canvasWidth / 2, canvasHeight / 2), zoom);
    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] += canvasWidth / 2 - center.x * zoom;
      vpt[5] += canvasHeight / 2 - center.y * zoom;
    }
    setZoom(zoom);
    canvas.requestRenderAll();
  };

  const toggleObjectLockById = (id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => o.customId === id);
    if (!obj) return;
    obj.locked = !obj.locked;
    obj.selectable = !obj.locked;
    obj.evented = !obj.locked;
    if (obj.locked) {
      canvas.discardActiveObject();
    }
    canvas.requestRenderAll();
    notifyLayersChanged();
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const imgEl = new window.Image();
      imgEl.onload = () => {
        // Scale to fit 400x400 max
        let w = imgEl.width;
        let h = imgEl.height;
        const maxDim = Math.min(2000, Math.max(w, h));
        if (w > 400 || h > 400) {
          const scale = 400 / Math.max(w, h);
          w *= scale;
          h *= scale;
        }

        const fabricImg = new FabricImage(imgEl, {
          left: (canvas.width ?? 800) / 2 / canvas.getZoom(),
          top: (canvas.height ?? 600) / 2 / canvas.getZoom(),
          originX: 'center',
          originY: 'center',
          scaleX: w / imgEl.width,
          scaleY: h / imgEl.height,
        });
        assignCustomProps(fabricImg, 'image');
        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.requestRenderAll();
        setShowWelcome(false);
        saveHistory();
        notifyLayersChanged();
        notifySelectionChanged();
        setTool('select');
      };
      imgEl.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleJSONImport = () => {
    jsonInputRef.current?.click();
  };

  const handleJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        historyPauseRef.current = true;
        canvas.loadFromJSON(json).then(() => {
          canvas.requestRenderAll();
          historyPauseRef.current = false;
          setShowWelcome(false);
          saveHistory();
          notifyLayersChanged();
          showToast('Design imported');
        }).catch(() => {
          historyPauseRef.current = false;
          showToast('Failed to import design');
        });
      } catch {
        showToast('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    zoomTo: (zoom: number) => zoomToLevel(zoom),
    getCanvas: () => canvasRef.current,
    getLayers: () => {
      const canvas = canvasRef.current;
      if (!canvas) return [];
      const objects = getCanvasObjects(canvas);
      return objects.map((obj) => ({
        id: obj.customId || '',
        name: (obj as FabricObject & { name?: string }).name || 'Object',
        type: obj.customType || obj.type || 'unknown',
        visible: obj.visible !== false,
        locked: !!obj.locked,
        selected: state.selectedObjectIds.includes(obj.customId || ''),
      }));
    },
    selectObjectById: (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find((o) => o.customId === id);
      if (obj && !obj.locked) {
        canvas.discardActiveObject();
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        notifySelectionChanged();
      }
    },
    toggleObjectVisibility: (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find((o) => o.customId === id);
      if (obj) {
        obj.visible = !obj.visible;
        canvas.requestRenderAll();
        notifyLayersChanged();
      }
    },
    toggleObjectLock: (id: string) => toggleObjectLockById(id),
    renameObject: (id: string, name: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find((o) => o.customId === id);
      if (obj) {
        (obj as FabricObject & { name?: string }).name = name;
        notifyLayersChanged();
      }
    },
    reorderObject: (fromId: string, toId: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const objects = canvas.getObjects();
      const fromObj = objects.find((o) => o.customId === fromId);
      const toObj = objects.find((o) => o.customId === toId);
      if (!fromObj || !toObj) return;
      const toIdx = objects.indexOf(toObj);
      canvas.remove(fromObj);
      canvas.insertAt(toIdx, fromObj);
      canvas.requestRenderAll();
      saveHistory();
      notifyLayersChanged();
    },
    addRectangleAtRandom: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = new Rect({
        left: Math.random() * 600 + 100,
        top: Math.random() * 400 + 100,
        width: 100,
        height: 100,
        fill: DEFAULT_FILL,
        stroke: DEFAULT_STROKE,
        strokeWidth: DEFAULT_STROKE_WIDTH,
      });
      assignCustomProps(rect, 'rectangle');
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.requestRenderAll();
      setShowWelcome(false);
      saveHistory();
      notifyLayersChanged();
      notifySelectionChanged();
    },
    getSelectedObjects: () => {
      const canvas = canvasRef.current;
      if (!canvas) return [];
      return canvas.getActiveObjects();
    },
    setObjectProperty: (prop: string, value: unknown) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const activeObjs = canvas.getActiveObjects();
      if (activeObjs.length === 0) return;

      activeObjs.forEach((obj) => {
        if (prop === 'width') {
          const scaleX = (value as number) / (obj.width ?? 1);
          obj.set({ scaleX });
        } else if (prop === 'height') {
          const scaleY = (value as number) / (obj.height ?? 1);
          obj.set({ scaleY });
        } else {
          obj.set({ [prop]: value });
        }
        obj.setCoords();
      });
      canvas.requestRenderAll();
      saveHistory();
      notifySelectionChanged();
    },
    duplicateSelected: duplicateSelectedObjects,
    deleteSelected: deleteSelectedObjects,
    bringToFront: bringToFrontAction,
    sendToBack: sendToBackAction,
    groupSelected: groupSelectedObjects,
    ungroupSelected: ungroupSelectedObjects,
    copySelected: copySelectedObjects,
    pasteClipboard: pasteFromClipboard,
    selectAll: selectAllObjects,
    triggerImageUpload: handleImageUpload,
    triggerJSONImport: handleJSONImport,
    bringForward: bringForwardAction,
    sendBackward: sendBackwardAction,
    zoomToFit: zoomToFitAction,
  }));

  const hasObjects = canvasRef.current ? getCanvasObjects(canvasRef.current).length > 0 : false;

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#1a1a1a]">
      <canvas id="fabric-canvas" />
      {showWelcome && !hasObjects && (
        <WelcomeOverlay
          onDismiss={() => setShowWelcome(false)}
          onImageUpload={handleImageUpload}
          onImportJSON={handleJSONImport}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,.webp"
        className="hidden"
        onChange={handleImageFile}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleJSONFile}
      />
    </div>
  );
});

CanvasArea.displayName = 'CanvasArea';

export default CanvasArea;
