import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Canvas, Rect, Ellipse, Triangle, Line, Textbox, PencilBrush,
  FabricObject, Point, Polygon, FabricImage, Group, Shadow, ActiveSelection,
  Path,
} from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../../store/canvasStore';
import { ToolType, ContextMenuOption, LayerInfo } from '../../types';
import {
  DEFAULT_FILL, DEFAULT_OPACITY, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH,
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
  performUndo: () => void;
  performRedo: () => void;
  alignObjects: (alignment: string) => void;
  switchPage: (pageId: string) => void;
  makeComponent: () => void;
  createInstance: () => void;
  toggleExpand: (id: string) => void;
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
  const { state, dispatch, setTool, setZoom, pushHistory, setSelected, showToast, setClipboard, savePageState } = useAppContext();
  const [showWelcome, setShowWelcome] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; options: ContextMenuOption[] } | null>(null);

  const isDrawingRef = useRef(false);
  const drawStartRef = useRef({ x: 0, y: 0 });
  const activeShapeRef = useRef<FabricObject | null>(null);
  const isPanningRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const prevToolRef = useRef<ToolType>('select');
  const penPointsRef = useRef<{ x: number; y: number }[]>([]);
  const penPreviewRef = useRef<FabricObject | null>(null);
  const expandedLayersRef = useRef<Set<string>>(new Set());
  const historyPauseRef = useRef(false);
  const historyRef = useRef(state.history);
  const historyIndexRef = useRef(state.historyIndex);
  historyRef.current = state.history;
  historyIndexRef.current = state.historyIndex;
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
    } else if (tool === 'frame') {
      canvas.defaultCursor = 'crosshair';
      canvas.selection = false;
    } else if (tool === 'pen') {
      canvas.defaultCursor = 'crosshair';
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

      // Ignore right-clicks for drawing/tool actions
      if (e.button === 2) return;

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

      // Frame tool
      if (tool === 'frame') {
        isDrawingRef.current = true;
        drawStartRef.current = { x: pointer.x, y: pointer.y };
        const frame = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: '#ffffff',
          stroke: '#cccccc',
          strokeWidth: 1,
          rx: 0,
          ry: 0,
        });
        assignCustomProps(frame, 'frame');
        canvas.add(frame);
        activeShapeRef.current = frame;
        canvas.requestRenderAll();
        setShowWelcome(false);
        return;
      }

      // Pen tool - click to add points
      if (tool === 'pen') {
        const points = penPointsRef.current;
        const newPoint = { x: pointer.x, y: pointer.y };

        // Check if closing the path (clicking near first point)
        if (points.length > 2) {
          const first = points[0];
          const dist = Math.sqrt((newPoint.x - first.x) ** 2 + (newPoint.y - first.y) ** 2);
          if (dist < 10) {
            // Close path
            const pathStr = points.reduce((acc, p, i) => {
              return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
            }, '') + ' Z';
            // Remove all pen-preview objects (dots and line preview)
            const penPreviews = canvas.getObjects().filter(
              (o) => (o as FabricObject & { name?: string }).name === 'pen-preview'
            );
            penPreviews.forEach((o) => canvas.remove(o));
            penPreviewRef.current = null;
            const path = new Path(pathStr, {
              fill: DEFAULT_FILL,
              stroke: DEFAULT_STROKE,
              strokeWidth: DEFAULT_STROKE_WIDTH,
              opacity: DEFAULT_OPACITY,
            });
            assignCustomProps(path, 'pen');
            canvas.add(path);
            canvas.setActiveObject(path);
            canvas.requestRenderAll();
            penPointsRef.current = [];
            penPreviewRef.current = null;
            setShowWelcome(false);
            saveHistory();
            notifyLayersChanged();
            setTool('select');
            return;
          }
        }

        points.push(newPoint);

        // Draw preview lines
        if (penPreviewRef.current) {
          canvas.remove(penPreviewRef.current);
        }
        if (points.length > 1) {
          const pathStr = points.reduce((acc, p, i) => {
            return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
          }, '');
          const preview = new Path(pathStr, {
            fill: '',
            stroke: '#7c5cfc',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          });
          (preview as FabricObject & { name?: string }).name = 'pen-preview';
          canvas.add(preview);
          penPreviewRef.current = preview;
        }

        // Draw point indicator
        const dot = new Ellipse({
          left: newPoint.x - 3,
          top: newPoint.y - 3,
          rx: 3,
          ry: 3,
          fill: '#7c5cfc',
          stroke: '',
          selectable: false,
          evented: false,
        });
        (dot as FabricObject & { name?: string }).name = 'pen-preview';
        canvas.add(dot);
        canvas.requestRenderAll();
        setShowWelcome(false);
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

      // Shape drawing (including frame)
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

  // Direct undo/redo - avoids useEffect timing issues
  const loadHistoryState = useCallback((targetIndex: number) => {
    const canvas = canvasRef.current;
    const hist = historyRef.current;
    if (!canvas || targetIndex < 0 || targetIndex >= hist.length) return;
    const targetState = hist[targetIndex];
    if (!targetState) return;

    historyPauseRef.current = true;
    try {
      const parsed = JSON.parse(targetState);
      canvas.loadFromJSON(parsed).then(() => {
        canvas.requestRenderAll();
        setTimeout(() => {
          historyPauseRef.current = false;
        }, 100);
        notifyLayersChanged();
        notifySelectionChanged();
      }).catch(() => {
        historyPauseRef.current = false;
      });
    } catch {
      historyPauseRef.current = false;
    }
  }, [notifyLayersChanged, notifySelectionChanged]);

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
          'x': 'text', 'p': 'pencil', 'f': 'frame', 'n': 'pen',
        };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) {
          setTool(tool);
          return;
        }
      }

      // Ctrl shortcuts
      if (ctrl) {
        // Ctrl+Shift+Delete: clear canvas (must be before bare Delete check)
        if ((e.key === 'Delete' || e.key === 'Backspace') && e.shiftKey) {
          e.preventDefault();
          if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            canvas.clear();
            canvas.backgroundColor = '#1a1a1a';
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
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          const idx = historyIndexRef.current;
          if (idx > 0) {
            historyIndexRef.current = idx - 1;
            dispatch({ type: 'UNDO' });
            loadHistoryState(idx - 1);
          }
          return;
        }
        if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          const idx = historyIndexRef.current;
          const hist = historyRef.current;
          if (idx < hist.length - 1) {
            historyIndexRef.current = idx + 1;
            dispatch({ type: 'REDO' });
            loadHistoryState(idx + 1);
          }
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
        if (e.key.toLowerCase() === 'g' && !e.shiftKey) {
          e.preventDefault();
          groupSelectedObjects();
          return;
        }
        if (e.key.toLowerCase() === 'g' && e.shiftKey) {
          e.preventDefault();
          ungroupSelectedObjects();
          return;
        }
        if (e.key === "'" || e.key === '`') {
          e.preventDefault();
          dispatch({ type: 'TOGGLE_GRID' });
          return;
        }
        if (e.key.toLowerCase() === 'e' && e.shiftKey) {
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
      }

      // Delete (after ctrl block so Ctrl+Shift+Delete is handled first)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedObjects();
        return;
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
          const prev = prevToolRef.current;
          if (prev === 'select') {
            canvas.defaultCursor = 'default';
            canvas.selection = true;
          } else if (prev === 'hand') {
            canvas.defaultCursor = 'grab';
          } else if (prev === 'text') {
            canvas.defaultCursor = 'text';
          } else if (prev === 'pencil') {
            canvas.defaultCursor = 'default';
            canvas.isDrawingMode = true;
          } else {
            // Shape tools
            canvas.defaultCursor = 'crosshair';
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

      const buildLayerInfo = (obj: FabricObject, depth: number): LayerInfo => {
        const id = obj.customId || '';
        const customType = obj.customType || obj.type || 'unknown';
        const info: LayerInfo = {
          id,
          name: (obj as FabricObject & { name?: string }).name || 'Object',
          type: customType,
          visible: obj.visible !== false,
          locked: !!obj.locked,
          selected: state.selectedObjectIds.includes(id),
          depth,
          expanded: expandedLayersRef.current.has(id),
          isComponent: customType === 'component',
          isInstance: customType === 'instance',
        };

        // If it's a group/frame, add children
        if (obj.type === 'group' || customType === 'frame' || customType === 'component') {
          const group = obj as Group;
          if (group.getObjects) {
            info.children = group.getObjects().map((child) => buildLayerInfo(child, depth + 1));
          }
        }

        return info;
      };

      return objects.map((obj) => buildLayerInfo(obj, 0));
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
    performUndo: () => {
      const idx = historyIndexRef.current;
      if (idx > 0) {
        historyIndexRef.current = idx - 1;
        dispatch({ type: 'UNDO' });
        loadHistoryState(idx - 1);
      }
    },
    performRedo: () => {
      const idx = historyIndexRef.current;
      const hist = historyRef.current;
      if (idx < hist.length - 1) {
        historyIndexRef.current = idx + 1;
        dispatch({ type: 'REDO' });
        loadHistoryState(idx + 1);
      }
    },
    alignObjects: (alignment: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const activeObjs = canvas.getActiveObjects();
      if (activeObjs.length < 2) return;

      const bounds = activeObjs.map((obj) => {
        const br = obj.getBoundingRect();
        return { obj, left: br.left, top: br.top, width: br.width, height: br.height };
      });

      switch (alignment) {
        case 'align-left': {
          const minLeft = Math.min(...bounds.map((b) => b.left));
          bounds.forEach((b) => {
            b.obj.set({ left: (b.obj.left ?? 0) + (minLeft - b.left) });
            b.obj.setCoords();
          });
          break;
        }
        case 'align-center-h': {
          const minLeft = Math.min(...bounds.map((b) => b.left));
          const maxRight = Math.max(...bounds.map((b) => b.left + b.width));
          const centerX = (minLeft + maxRight) / 2;
          bounds.forEach((b) => {
            b.obj.set({ left: (b.obj.left ?? 0) + (centerX - (b.left + b.width / 2)) });
            b.obj.setCoords();
          });
          break;
        }
        case 'align-right': {
          const maxRight = Math.max(...bounds.map((b) => b.left + b.width));
          bounds.forEach((b) => {
            b.obj.set({ left: (b.obj.left ?? 0) + (maxRight - (b.left + b.width)) });
            b.obj.setCoords();
          });
          break;
        }
        case 'align-top': {
          const minTop = Math.min(...bounds.map((b) => b.top));
          bounds.forEach((b) => {
            b.obj.set({ top: (b.obj.top ?? 0) + (minTop - b.top) });
            b.obj.setCoords();
          });
          break;
        }
        case 'align-center-v': {
          const minTop = Math.min(...bounds.map((b) => b.top));
          const maxBottom = Math.max(...bounds.map((b) => b.top + b.height));
          const centerY = (minTop + maxBottom) / 2;
          bounds.forEach((b) => {
            b.obj.set({ top: (b.obj.top ?? 0) + (centerY - (b.top + b.height / 2)) });
            b.obj.setCoords();
          });
          break;
        }
        case 'align-bottom': {
          const maxBottom = Math.max(...bounds.map((b) => b.top + b.height));
          bounds.forEach((b) => {
            b.obj.set({ top: (b.obj.top ?? 0) + (maxBottom - (b.top + b.height)) });
            b.obj.setCoords();
          });
          break;
        }
        case 'distribute-h': {
          if (bounds.length < 3) break;
          bounds.sort((a, b) => a.left - b.left);
          const totalWidth = bounds[bounds.length - 1].left + bounds[bounds.length - 1].width - bounds[0].left;
          const objWidthSum = bounds.reduce((sum, b) => sum + b.width, 0);
          const gap = (totalWidth - objWidthSum) / (bounds.length - 1);
          let x = bounds[0].left;
          bounds.forEach((b, i) => {
            if (i > 0) {
              b.obj.set({ left: (b.obj.left ?? 0) + (x - b.left) });
              b.obj.setCoords();
            }
            x += b.width + gap;
          });
          break;
        }
        case 'distribute-v': {
          if (bounds.length < 3) break;
          bounds.sort((a, b) => a.top - b.top);
          const totalHeight = bounds[bounds.length - 1].top + bounds[bounds.length - 1].height - bounds[0].top;
          const objHeightSum = bounds.reduce((sum, b) => sum + b.height, 0);
          const gap = (totalHeight - objHeightSum) / (bounds.length - 1);
          let y = bounds[0].top;
          bounds.forEach((b, i) => {
            if (i > 0) {
              b.obj.set({ top: (b.obj.top ?? 0) + (y - b.top) });
              b.obj.setCoords();
            }
            y += b.height + gap;
          });
          break;
        }
      }

      canvas.requestRenderAll();
      saveHistory();
      notifySelectionChanged();
    },
    switchPage: (pageId: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Save current page state
      const currentJSON = JSON.stringify(canvas.toObject(['customId', 'name', 'selectable', 'evented', 'customType', 'locked']));
      savePageState(state.activePageId, currentJSON);

      // Load target page
      const targetPage = state.pages.find((p) => p.id === pageId);
      if (targetPage && targetPage.canvasJSON) {
        historyPauseRef.current = true;
        try {
          const parsed = JSON.parse(targetPage.canvasJSON);
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
      } else {
        // New blank page
        canvas.clear();
        canvas.backgroundColor = '#1a1a1a';
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
        notifyLayersChanged();
        notifySelectionChanged();
      }
    },
    makeComponent: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const activeObjs = canvas.getActiveObjects();
      if (activeObjs.length === 0) return;

      let component: FabricObject;
      if (activeObjs.length === 1) {
        component = activeObjs[0];
      } else {
        // Group multiple objects into a component
        const group = new Group(activeObjs, {});
        activeObjs.forEach((obj) => canvas.remove(obj));
        assignCustomProps(group, 'component');
        canvas.add(group);
        component = group;
      }
      component.customType = 'component';
      (component as FabricObject & { name?: string }).name =
        (component as FabricObject & { name?: string }).name?.replace(/^(Rectangle|Ellipse|Group|Triangle)/, 'Component') || 'Component';
      canvas.setActiveObject(component);
      canvas.requestRenderAll();
      saveHistory();
      notifyLayersChanged();
      notifySelectionChanged();
      showToast('Component created');
    },
    createInstance: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (!active || active.customType !== 'component') return;

      active.clone().then((cloned: FabricObject) => {
        cloned.set({ left: (cloned.left ?? 0) + 30, top: (cloned.top ?? 0) + 30 });
        cloned.customId = uuidv4();
        cloned.customType = 'instance';
        (cloned as FabricObject & { name?: string }).name =
          ((active as FabricObject & { name?: string }).name || 'Component') + ' Instance';
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
        saveHistory();
        notifyLayersChanged();
        notifySelectionChanged();
        showToast('Instance created');
      });
    },
    toggleExpand: (id: string) => {
      if (expandedLayersRef.current.has(id)) {
        expandedLayersRef.current.delete(id);
      } else {
        expandedLayersRef.current.add(id);
      }
      notifyLayersChanged();
    },
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
