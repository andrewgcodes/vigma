import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Rect, Ellipse, Triangle, Line, Textbox, PencilBrush, Point, FabricImage, Polygon, FabricObject, ActiveSelection, Group, Path, type TPointerEvent } from 'fabric';
import { useAppContext } from '../../store/canvasStore';
import { assignObjectId, assignDefaultName, getObjectId, getLayersFromCanvas, saveCanvasJSON } from '../../utils/canvasHelpers';
import { DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH, LINE_STROKE, LINE_STROKE_WIDTH, ARTBOARD_WIDTH, ARTBOARD_HEIGHT } from '../../utils/defaultStyles';
import WelcomeOverlay from './WelcomeOverlay';
import Rulers from './Rulers';
import type { ToolType } from '../../types';

export default function CanvasArea() {
  const { state, dispatch, canvasRef } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const drawStart = useRef({ x: 0, y: 0 });
  const activeShape = useRef<FabricObject | null>(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const spaceHeld = useRef(false);
  const prevTool = useRef<ToolType>('select');
  const [showWelcome, setShowWelcome] = useState(true);
  const historyLock = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  const updateLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    dispatch({ type: 'SET_LAYERS', layers: getLayersFromCanvas(canvas) });
  }, [canvasRef, dispatch]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyLock.current) return;
    const json = saveCanvasJSON(canvas);
    dispatch({ type: 'PUSH_HISTORY', state: json });
    dispatch({ type: 'UPDATE_PAGE_CANVAS', pageId: state.activePageId, canvasJSON: json });
  }, [canvasRef, dispatch, state.activePageId]);

  const initCanvas = useCallback(() => {
    if (!containerRef.current || canvasRef.current) return;

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
      selectionColor: 'rgba(124, 92, 252, 0.1)',
      selectionBorderColor: '#7c5cfc',
      selectionLineWidth: 1,
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
      hoverCursor: 'default',
    });
    (artboard as unknown as Record<string, unknown>).name = 'artboard';
    canvas.add(artboard);
    canvas.requestRenderAll();

    // Try to restore from localStorage
    let restored = false;
    try {
      const pagesSaved = localStorage.getItem('vigma-pages');
      if (pagesSaved) {
        const parsed = JSON.parse(pagesSaved) as { pages?: any[]; activePageId?: string };
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          const activePageId = parsed.activePageId || parsed.pages[0].id;
          dispatch({ type: 'SET_PAGES_STATE', pages: parsed.pages as any, activePageId });
          const activePage = (parsed.pages as any[]).find((p) => p.id === activePageId) || parsed.pages[0];
          if (activePage?.canvasJSON) {
            const pageJSON = JSON.parse(activePage.canvasJSON);
            canvas.loadFromJSON(pageJSON).then(() => {
              // Re-mark artboard as non-selectable after JSON restore
              canvas.getObjects().forEach((obj) => {
                const record = obj as unknown as Record<string, unknown>;
                if (record.name === 'artboard' || (obj.width === ARTBOARD_WIDTH && obj.height === ARTBOARD_HEIGHT && obj.fill === '#ffffff' && !record.objectId)) {
                  obj.selectable = false;
                  obj.evented = false;
                  obj.hoverCursor = 'default';
                  record.name = 'artboard';
                }
              });
              canvas.requestRenderAll();
              setTimeout(() => {
                updateLayers();
                saveHistory();
              }, 200);
              setShowWelcome(false);
              dispatch({ type: 'SHOW_TOAST', message: 'Previous design restored' });
            });
            restored = true;
          }
        }
      }

      // Backwards-compat: restore from single-canvas autosave
      if (!restored) {
        const saved = localStorage.getItem('vigma-autosave');
        if (saved) {
          const parsed = JSON.parse(saved);
          canvas.loadFromJSON(parsed).then(() => {
            // Re-mark artboard as non-selectable after JSON restore
            canvas.getObjects().forEach((obj) => {
              const record = obj as unknown as Record<string, unknown>;
              if (record.name === 'artboard' || (obj.width === ARTBOARD_WIDTH && obj.height === ARTBOARD_HEIGHT && obj.fill === '#ffffff' && !record.objectId)) {
                obj.selectable = false;
                obj.evented = false;
                obj.hoverCursor = 'default';
                record.name = 'artboard';
              }
            });
            canvas.requestRenderAll();
            setTimeout(() => {
              updateLayers();
              saveHistory();
            }, 200);
            setShowWelcome(false);
            dispatch({ type: 'SHOW_TOAST', message: 'Previous design restored' });
          });
          restored = true;
        }
      }
    } catch {
      localStorage.removeItem('vigma-autosave');
      localStorage.removeItem('vigma-pages');
    }

    // Save initial history only if no saved data to restore
    if (!restored) {
      setTimeout(() => {
        saveHistory();
      }, 100);
    }

    dispatch({ type: 'SET_CANVAS_READY' });

    // Auto-save every 5 seconds (backwards-compatible single-canvas key)
    autoSaveTimer.current = setInterval(() => {
      try {
        localStorage.setItem('vigma-autosave', saveCanvasJSON(canvas));
      } catch { /* ignore */ }
    }, 5000);

    return canvas;
  }, [canvasRef, dispatch, saveHistory, updateLayers]);

  // Initialize canvas
  useEffect(() => {
    const canvas = initCanvas();
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
      if (canvas) canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  // Persist pages state to localStorage
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          'vigma-pages',
          JSON.stringify({ pages: state.pages, activePageId: state.activePageId })
        );
      } catch {
        // ignore
      }
    }, 500);

    return () => clearTimeout(t);
  }, [state.pages, state.activePageId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.setDimensions({ width: container.clientWidth, height: container.clientHeight });
      canvas.requestRenderAll();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  // Canvas event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Zoom with mouse wheel
    const handleWheel = (opt: { e: WheelEvent }) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** e.deltaY;
      zoom = Math.min(Math.max(zoom, 0.1), 5);
      canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom);
      dispatch({ type: 'SET_ZOOM', zoom });
    };
    canvas.on('mouse:wheel', handleWheel);

    // Selection events
    const handleSelection = () => {
      const activeObjs = canvas.getActiveObjects();
      const ids = activeObjs.map((obj) => getObjectId(obj)).filter(Boolean);
      dispatch({ type: 'SET_SELECTED', ids });
      window.dispatchEvent(new CustomEvent('vigma:props-update'));
    };
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    const handleSelectionCleared = () => {
      dispatch({ type: 'SET_SELECTED', ids: [] });
    };
    canvas.on('selection:cleared', handleSelectionCleared);

    // Object modified
    const handleModified = () => {
      saveHistory();
      updateLayers();
      window.dispatchEvent(new CustomEvent('vigma:props-update'));
    };
    const handleMoving = () => {
      window.dispatchEvent(new CustomEvent('vigma:props-update'));
    };
    const handleScaling = () => {
      window.dispatchEvent(new CustomEvent('vigma:props-update'));
    };
    const handleRotating = () => {
      window.dispatchEvent(new CustomEvent('vigma:props-update'));
    };
    canvas.on('object:modified', handleModified);
    canvas.on('object:moving', handleMoving);
    canvas.on('object:scaling', handleScaling);
    canvas.on('object:rotating', handleRotating);

    return () => {
      canvas.off('mouse:wheel', handleWheel);
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:modified', handleModified);
      canvas.off('object:moving', handleMoving);
      canvas.off('object:scaling', handleScaling);
      canvas.off('object:rotating', handleRotating);
    };
  }, [canvasRef, dispatch, saveHistory, updateLayers]);

  // Drawing handlers based on active tool
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tool = state.activeTool;

    // Configure canvas mode
    canvas.isDrawingMode = tool === 'pencil';
    canvas.selection = tool === 'select' || tool === 'pen';

    if (tool === 'pencil') {
      const brush = new PencilBrush(canvas);
      brush.color = '#ffffff';
      brush.width = 2;
      canvas.freeDrawingBrush = brush;
    }

    // Set cursor
    if (tool === 'hand') {
      canvas.defaultCursor = 'grab';
    } else if (['rectangle', 'ellipse', 'triangle', 'line', 'arrow', 'star', 'frame'].includes(tool)) {
      canvas.defaultCursor = 'crosshair';
    } else if (tool === 'text') {
      canvas.defaultCursor = 'text';
    } else if (tool === 'pen') {
      canvas.defaultCursor = 'crosshair';
    } else {
      canvas.defaultCursor = 'default';
    }

    const handleMouseDown = (opt: { e: TPointerEvent }) => {
      const e = opt.e as MouseEvent;

      // Pan with hand tool or space
      if (tool === 'hand' || spaceHeld.current) {
        isPanning.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        canvas.defaultCursor = 'grabbing';
        return;
      }

      // Middle mouse button pan
      if (e.button === 1) {
        isPanning.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (tool === 'select' || tool === 'pencil' || tool === 'pen') return;

      // Text tool
      if (tool === 'text') {
        const pointer = canvas.getScenePoint(e);
        const text = new Textbox('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Inter',
          fontSize: 24,
          fill: '#333333',
          width: 200,
          editable: true,
        });
        assignObjectId(text);
        assignDefaultName(text);
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        canvas.requestRenderAll();
        updateLayers();
        saveHistory();
        setShowWelcome(false);
        dispatch({ type: 'SET_TOOL', tool: 'select' });
        return;
      }

      // Shape drawing
      const pointer = canvas.getScenePoint(e);
      isDrawing.current = true;
      drawStart.current = { x: pointer.x, y: pointer.y };

      let shape: FabricObject | null = null;

      switch (tool) {
        case 'rectangle':
          shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeUniform: true,
          });
          break;
        case 'ellipse':
          shape = new Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 0,
            ry: 0,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeUniform: true,
          });
          break;
        case 'triangle':
          shape = new Triangle({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeUniform: true,
          });
          break;
        case 'line':
          shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: LINE_STROKE,
            strokeWidth: LINE_STROKE_WIDTH,
            strokeUniform: true,
          });
          break;
        case 'arrow': {
          shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: LINE_STROKE,
            strokeWidth: LINE_STROKE_WIDTH,
            strokeUniform: true,
          });
          break;
        }
        case 'star': {
          shape = new Polygon(createStarPoints(0, 0, 0, 5), {
            left: pointer.x,
            top: pointer.y,
            fill: DEFAULT_FILL,
            stroke: DEFAULT_STROKE,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeUniform: true,
          });
          break;
        }
        case 'frame': {
          shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: '#ffffff',
            stroke: '#333333',
            strokeWidth: 1,
            strokeUniform: true,
          });
          // Mark as frame for layer display
          (shape as unknown as Record<string, unknown>).isFrame = true;
          break;
        }
      }

      if (shape) {
        activeShape.current = shape;
        canvas.add(shape);
        canvas.requestRenderAll();
      }
    };

    const handleMouseMove = (opt: { e: TPointerEvent }) => {
      const e = opt.e as MouseEvent;

      // Panning
      if (isPanning.current) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPanPos.current.x;
          vpt[5] += e.clientY - lastPanPos.current.y;
          canvas.requestRenderAll();
        }
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (!isDrawing.current || !activeShape.current) return;

      const pointer = canvas.getScenePoint(e);
      let width = pointer.x - drawStart.current.x;
      let height = pointer.y - drawStart.current.y;

      // Shift for constrained proportions
      if (e.shiftKey) {
        const maxDim = Math.max(Math.abs(width), Math.abs(height));
        width = Math.sign(width) * maxDim;
        height = Math.sign(height) * maxDim;
      }

      const shape = activeShape.current;

      if (shape.type === 'line') {
        (shape as Line).set({
          x2: e.shiftKey ? drawStart.current.x + width : pointer.x,
          y2: e.shiftKey ? drawStart.current.y + height : pointer.y,
        });
      } else if (shape.type === 'ellipse') {
        (shape as Ellipse).set({
          rx: Math.abs(width) / 2,
          ry: Math.abs(height) / 2,
          left: width < 0 ? pointer.x : drawStart.current.x,
          top: height < 0 ? pointer.y : drawStart.current.y,
        });
      } else if (shape.type === 'polygon') {
        const size = Math.max(Math.abs(width), Math.abs(height)) / 2;
        const points = createStarPoints(0, 0, size, 5);
        (shape as Polygon).set({
          points,
          width: size * 2,
          height: size * 2,
          left: width < 0 ? pointer.x : drawStart.current.x,
          top: height < 0 ? pointer.y : drawStart.current.y,
          pathOffset: new Point(0, 0),
        });
      } else {
        shape.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : drawStart.current.x,
          top: height < 0 ? pointer.y : drawStart.current.y,
        });
      }

      canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (isPanning.current) {
        isPanning.current = false;
        if (tool === 'hand') canvas.defaultCursor = 'grab';
        return;
      }

      if (!isDrawing.current || !activeShape.current) return;

      isDrawing.current = false;
      const shape = activeShape.current;

      // Check for zero-size shapes
      const w = shape.width || 0;
      const h = shape.height || 0;
      const isLine = shape.type === 'line';
      const lineObj = shape as Line;
      const lineLen = isLine ? Math.sqrt((lineObj.x2! - lineObj.x1!) ** 2 + (lineObj.y2! - lineObj.y1!) ** 2) : 0;

      if ((!isLine && w < 2 && h < 2) || (isLine && lineLen < 2)) {
        canvas.remove(shape);
        canvas.requestRenderAll();
        activeShape.current = null;
        return;
      }

      assignObjectId(shape);
      assignDefaultName(shape);
      canvas.setActiveObject(shape);
      canvas.requestRenderAll();
      updateLayers();
      saveHistory();
      setShowWelcome(false);
      dispatch({ type: 'SET_TOOL', tool: 'select' });
      activeShape.current = null;
    };

    // Pencil path created
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePathCreated = (opt: any) => {
      assignObjectId(opt.path);
      assignDefaultName(opt.path);
      canvas.requestRenderAll();
      updateLayers();
      saveHistory();
      setShowWelcome(false);
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('path:created', handlePathCreated);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('path:created', handlePathCreated);
    };
  }, [state.activeTool, canvasRef, dispatch, saveHistory, updateLayers]);

  // Keyboard shortcuts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isInputFocused = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
    };

    const isTextEditing = () => {
      const active = canvas.getActiveObject();
      return active?.type === 'textbox' && (active as Textbox).isEditing;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when editing text
      if (isInputFocused() || isTextEditing()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts
      if (!ctrl && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v': dispatch({ type: 'SET_TOOL', tool: 'select' }); return;
          case 'h': dispatch({ type: 'SET_TOOL', tool: 'hand' }); return;
          case 'r': dispatch({ type: 'SET_TOOL', tool: 'rectangle' }); return;
          case 'o': dispatch({ type: 'SET_TOOL', tool: 'ellipse' }); return;
          case 't': dispatch({ type: 'SET_TOOL', tool: 'triangle' }); return;
          case 'l': dispatch({ type: 'SET_TOOL', tool: 'line' }); return;
          case 'a': dispatch({ type: 'SET_TOOL', tool: 'arrow' }); return;
          case 's': dispatch({ type: 'SET_TOOL', tool: 'star' }); return;
          case 'x': dispatch({ type: 'SET_TOOL', tool: 'text' }); return;
          case 'p': dispatch({ type: 'SET_TOOL', tool: 'pencil' }); return;
          case 'f': dispatch({ type: 'SET_TOOL', tool: 'frame' }); return;
          case 'n': dispatch({ type: 'SET_TOOL', tool: 'pen' }); return;
        }
      }

      // Space for pan
      if (e.code === 'Space' && !spaceHeld.current) {
        e.preventDefault();
        spaceHeld.current = true;
        prevTool.current = state.activeTool;
        canvas.defaultCursor = 'grab';
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'delete' }));
        return;
      }

      // Ctrl shortcuts
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              window.dispatchEvent(new CustomEvent('vigma:redo'));
            } else {
              window.dispatchEvent(new CustomEvent('vigma:undo'));
            }
            return;
          case 'y':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:redo'));
            return;
          case 'c':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'copy' }));
            return;
          case 'x':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'cut' }));
            return;
          case 'v':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'paste' }));
            return;
          case 'd':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'duplicate' }));
            return;
          case 'a':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'select-all' }));
            return;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) {
              window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'ungroup' }));
            } else {
              window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'group' }));
            }
            return;
          case "'":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'toggle-grid' }));
            return;
          case '0':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'reset-zoom' }));
            return;
          case '1':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'zoom-fit' }));
            return;
          case ']':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'bring-front' }));
            return;
          case '[':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'send-back' }));
            return;
          case '=':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'zoom-in' }));
            return;
          case '-':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'zoom-out' }));
            return;
        }
        // Ctrl+Shift+E for export
        if (e.shiftKey && e.key.toLowerCase() === 'e') {
          e.preventDefault();
          dispatch({ type: 'SHOW_EXPORT_MODAL' });
          return;
        }
        // Ctrl+Shift+Delete for clear
        if (e.shiftKey && e.key === 'Delete') {
          e.preventDefault();
          if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            canvas.clear();
            canvas.backgroundColor = '#1a1a1a';
            // Re-add artboard
            const container = containerRef.current;
            if (container) {
              const artboard = new Rect({
                left: (container.clientWidth - ARTBOARD_WIDTH) / 2,
                top: (container.clientHeight - ARTBOARD_HEIGHT) / 2,
                width: ARTBOARD_WIDTH,
                height: ARTBOARD_HEIGHT,
                fill: '#ffffff',
                selectable: false,
                evented: false,
              });
              (artboard as unknown as Record<string, unknown>).name = 'artboard';
              canvas.add(artboard);
            }
            canvas.requestRenderAll();
            localStorage.removeItem('vigma-autosave');
            updateLayers();
            dispatch({ type: 'SET_HISTORY', history: [], historyIndex: -1 });
            saveHistory();
            setShowWelcome(true);
          }
          return;
        }
      }

      // Z-order shortcuts without ctrl
      if (!ctrl) {
        if (e.key === ']') {
          window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'bring-forward' }));
          return;
        }
        if (e.key === '[') {
          window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'send-backward' }));
          return;
        }
        if (e.key === '+' || e.key === '=') {
          window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'zoom-in' }));
          return;
        }
        if (e.key === '-') {
          window.dispatchEvent(new CustomEvent('vigma:action', { detail: 'zoom-out' }));
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spaceHeld.current) {
        spaceHeld.current = false;
        dispatch({ type: 'SET_TOOL', tool: prevTool.current });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, dispatch, state.activeTool, saveHistory, updateLayers]);

  // Custom event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleAction = (e: Event) => {
      const action = (e as CustomEvent).detail;
      const activeObjs = canvas.getActiveObjects();

      switch (action) {
        case 'delete': {
          activeObjs.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          updateLayers();
          saveHistory();
          break;
        }
        case 'copy': {
          if (activeObjs.length > 0) {
            const serialized = activeObjs.map((obj) => obj.toObject(['objectId', 'customName']));
            dispatch({ type: 'SET_CLIPBOARD', data: serialized });
            dispatch({ type: 'SHOW_TOAST', message: 'Copied' });
          }
          break;
        }
        case 'cut': {
          if (activeObjs.length > 0) {
            const serialized = activeObjs.map((obj) => obj.toObject(['objectId', 'customName']));
            dispatch({ type: 'SET_CLIPBOARD', data: serialized });
            activeObjs.forEach((obj) => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            updateLayers();
            saveHistory();
            dispatch({ type: 'SHOW_TOAST', message: 'Cut' });
          }
          break;
        }
        case 'paste': {
          if (state.clipboard && state.clipboard.length > 0) {
            state.clipboard.forEach((data) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (FabricObject as any).fromObject(data).then((obj: FabricObject) => {
                obj.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
                assignObjectId(obj);
                assignDefaultName(obj);
                canvas.add(obj);
                canvas.setActiveObject(obj);
                canvas.requestRenderAll();
                updateLayers();
                saveHistory();
              });
            });
            dispatch({ type: 'SHOW_TOAST', message: 'Pasted' });
          }
          break;
        }
        case 'duplicate': {
          const promises = activeObjs.map((obj) =>
            obj.clone(['objectId', 'customName']).then((cloned: FabricObject) => {
              cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
              assignObjectId(cloned);
              assignDefaultName(cloned);
              canvas.add(cloned);
              return cloned;
            })
          );
          Promise.all(promises).then((clones) => {
            canvas.discardActiveObject();
            if (clones.length === 1) {
              canvas.setActiveObject(clones[0]);
            }
            canvas.requestRenderAll();
            updateLayers();
            saveHistory();
          });
          break;
        }
        case 'select-all': {
          const allObjs = canvas.getObjects().filter(
            (obj) => (obj as unknown as Record<string, unknown>).customName !== undefined && obj.selectable
          );
          if (allObjs.length > 0) {
            const selection = new ActiveSelection(allObjs, { canvas });
            canvas.setActiveObject(selection);
            canvas.requestRenderAll();
          }
          break;
        }
        case 'bring-front': {
          activeObjs.forEach((obj) => canvas.bringObjectToFront(obj));
          canvas.requestRenderAll();
          updateLayers();
          saveHistory();
          break;
        }
        case 'bring-forward': {
          activeObjs.forEach((obj) => canvas.bringObjectForward(obj));
          canvas.requestRenderAll();
          updateLayers();
          saveHistory();
          break;
        }
        case 'send-backward': {
          activeObjs.forEach((obj) => canvas.sendObjectBackwards(obj));
          canvas.requestRenderAll();
          updateLayers();
          saveHistory();
          break;
        }
        case 'send-back': {
          activeObjs.forEach((obj) => canvas.sendObjectToBack(obj));
          canvas.requestRenderAll();
          updateLayers();
          saveHistory();
          break;
        }
        case 'group': {
          if (activeObjs.length >= 2) {
            const group = new Group(activeObjs);
            canvas.discardActiveObject();
            activeObjs.forEach((obj) => canvas.remove(obj));
            assignObjectId(group);
            assignDefaultName(group);
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.requestRenderAll();
            updateLayers();
            saveHistory();
          }
          break;
        }
        case 'ungroup': {
          const active = canvas.getActiveObject();
          if (active && active.type === 'group') {
            const group = active as Group;
            const items = group.removeAll();
            canvas.remove(group);
            items.forEach((item) => {
              canvas.add(item);
            });
            canvas.requestRenderAll();
            updateLayers();
            saveHistory();
          }
          break;
        }
        case 'toggle-grid': {
          dispatch({ type: 'TOGGLE_GRID' });
          break;
        }
        case 'reset-zoom': {
          const center = canvas.getCenterPoint();
          canvas.zoomToPoint(center, 1);
          dispatch({ type: 'SET_ZOOM', zoom: 1 });
          break;
        }
        case 'zoom-fit': {
          const objects = canvas.getObjects().filter(
            (obj) => (obj as unknown as Record<string, unknown>).customName !== undefined
          );
          if (objects.length === 0) return;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          objects.forEach((obj) => {
            const bound = obj.getBoundingRect();
            minX = Math.min(minX, bound.left);
            minY = Math.min(minY, bound.top);
            maxX = Math.max(maxX, bound.left + bound.width);
            maxY = Math.max(maxY, bound.top + bound.height);
          });
          const bw = maxX - minX;
          const bh = maxY - minY;
          const cw = canvas.getWidth();
          const ch = canvas.getHeight();
          const zoom = Math.min(cw / (bw + 100), ch / (bh + 100), 5);
          canvas.setZoom(zoom);
          const vpt = canvas.viewportTransform;
          if (vpt) {
            vpt[4] = cw / 2 - (minX + bw / 2) * zoom;
            vpt[5] = ch / 2 - (minY + bh / 2) * zoom;
          }
          canvas.requestRenderAll();
          dispatch({ type: 'SET_ZOOM', zoom });
          break;
        }
        case 'zoom-in': {
          const zoom = Math.min(5, canvas.getZoom() + 0.1);
          const center = canvas.getCenterPoint();
          canvas.zoomToPoint(center, zoom);
          dispatch({ type: 'SET_ZOOM', zoom });
          break;
        }
        case 'zoom-out': {
          const zoom = Math.max(0.1, canvas.getZoom() - 0.1);
          const center = canvas.getCenterPoint();
          canvas.zoomToPoint(center, zoom);
          dispatch({ type: 'SET_ZOOM', zoom });
          break;
        }
        case 'lock': {
          activeObjs.forEach((obj) => {
            obj.selectable = !obj.selectable;
            obj.evented = obj.selectable;
          });
          canvas.requestRenderAll();
          updateLayers();
          break;
        }
      }
    };

    const handleUndo = () => {
      if (state.historyIndex <= 0) return;
      historyLock.current = true;
      const prevState = state.history[state.historyIndex - 1];
      canvas.loadFromJSON(JSON.parse(prevState)).then(() => {
        canvas.requestRenderAll();
        dispatch({ type: 'UNDO' });
        updateLayers();
        historyLock.current = false;
      });
    };

    const handleRedo = () => {
      if (state.historyIndex >= state.history.length - 1) return;
      historyLock.current = true;
      const nextState = state.history[state.historyIndex + 1];
      canvas.loadFromJSON(JSON.parse(nextState)).then(() => {
        canvas.requestRenderAll();
        dispatch({ type: 'REDO' });
        updateLayers();
        historyLock.current = false;
      });
    };

    const handleImageUpload = (e: Event) => {
      const file = (e as CustomEvent).detail;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const imgEl = new window.Image();
        imgEl.onload = () => {
          FabricImage.fromURL(dataUrl).then((img) => {
            // Scale to fit 400x400 max
            let scale = 1;
            if (imgEl.width > 400 || imgEl.height > 400) {
              scale = 400 / Math.max(imgEl.width, imgEl.height);
            }
            img.set({
              scaleX: scale,
              scaleY: scale,
              left: canvas.getWidth() / 2 / canvas.getZoom() - (imgEl.width * scale) / 2,
              top: canvas.getHeight() / 2 / canvas.getZoom() - (imgEl.height * scale) / 2,
            });
            assignObjectId(img);
            assignDefaultName(img);
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
            updateLayers();
            saveHistory();
            setShowWelcome(false);
          });
        };
        imgEl.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };

    const handleAddRect = () => {
      const rect = new Rect({
        left: Math.random() * 400 + 200,
        top: Math.random() * 300 + 100,
        width: 100,
        height: 100,
        fill: DEFAULT_FILL,
        stroke: DEFAULT_STROKE,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        strokeUniform: true,
      });
      assignObjectId(rect);
      assignDefaultName(rect);
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.requestRenderAll();
      updateLayers();
      saveHistory();
      setShowWelcome(false);
    };

    const handleUpdateLayers = () => updateLayers();
    const handleSaveHistory = () => saveHistory();

    const handleImportJSON = (e: Event) => {
      try {
        const json = (e as CustomEvent).detail;
        canvas.loadFromJSON(JSON.parse(json)).then(() => {
          canvas.requestRenderAll();
          updateLayers();
          saveHistory();
          setShowWelcome(false);
          dispatch({ type: 'SHOW_TOAST', message: 'Design imported' });
        });
      } catch {
        dispatch({ type: 'SHOW_TOAST', message: 'Failed to import JSON' });
      }
    };

    const handleTriggerImageUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.png,.jpg,.jpeg,.svg,.webp';
      input.onchange = (ev) => {
        const file = (ev.target as HTMLInputElement).files?.[0];
        if (file) {
          window.dispatchEvent(new CustomEvent('vigma:image-upload', { detail: file }));
        }
      };
      input.click();
    };

    // Boolean operations handler
    const handleBoolean = (e: Event) => {
      const operation = (e as CustomEvent).detail;
      const activeObjs = canvas.getActiveObjects();
      if (activeObjs.length < 2) {
        dispatch({ type: 'SHOW_TOAST', message: 'Select at least 2 objects for boolean operations' });
        return;
      }

      // For boolean ops, we group the selected objects visually
      // True SVG boolean ops would require a path library - we simulate with grouping
      switch (operation) {
        case 'union': {
          const group = new Group(activeObjs);
          canvas.discardActiveObject();
          activeObjs.forEach((obj) => canvas.remove(obj));
          assignObjectId(group);
          (group as unknown as Record<string, unknown>).customName = 'Union';
          canvas.add(group);
          canvas.setActiveObject(group);
          break;
        }
        case 'subtract': {
          // Keep first object, remove others from view (simulated)
          const group = new Group(activeObjs);
          canvas.discardActiveObject();
          activeObjs.forEach((obj) => canvas.remove(obj));
          assignObjectId(group);
          (group as unknown as Record<string, unknown>).customName = 'Subtract';
          canvas.add(group);
          canvas.setActiveObject(group);
          break;
        }
        case 'intersect': {
          const group = new Group(activeObjs);
          canvas.discardActiveObject();
          activeObjs.forEach((obj) => canvas.remove(obj));
          assignObjectId(group);
          (group as unknown as Record<string, unknown>).customName = 'Intersect';
          canvas.add(group);
          canvas.setActiveObject(group);
          break;
        }
        case 'exclude': {
          const group = new Group(activeObjs);
          canvas.discardActiveObject();
          activeObjs.forEach((obj) => canvas.remove(obj));
          assignObjectId(group);
          (group as unknown as Record<string, unknown>).customName = 'Exclude';
          canvas.add(group);
          canvas.setActiveObject(group);
          break;
        }
      }
      canvas.requestRenderAll();
      updateLayers();
      saveHistory();
      dispatch({ type: 'SHOW_TOAST', message: `Boolean ${operation} applied` });
    };

    window.addEventListener('vigma:action', handleAction);
    window.addEventListener('vigma:undo', handleUndo);
    window.addEventListener('vigma:redo', handleRedo);
    window.addEventListener('vigma:image-upload', handleImageUpload);
    window.addEventListener('vigma:add-rect', handleAddRect);
    window.addEventListener('vigma:update-layers', handleUpdateLayers);
    window.addEventListener('vigma:save-history', handleSaveHistory);
    window.addEventListener('vigma:import-json', handleImportJSON);
    window.addEventListener('vigma:trigger-image-upload', handleTriggerImageUpload);
    window.addEventListener('vigma:boolean', handleBoolean);

    return () => {
      window.removeEventListener('vigma:action', handleAction);
      window.removeEventListener('vigma:undo', handleUndo);
      window.removeEventListener('vigma:redo', handleRedo);
      window.removeEventListener('vigma:image-upload', handleImageUpload);
      window.removeEventListener('vigma:add-rect', handleAddRect);
      window.removeEventListener('vigma:update-layers', handleUpdateLayers);
      window.removeEventListener('vigma:save-history', handleSaveHistory);
      window.removeEventListener('vigma:import-json', handleImportJSON);
      window.removeEventListener('vigma:trigger-image-upload', handleTriggerImageUpload);
      window.removeEventListener('vigma:boolean', handleBoolean);
    };
  }, [canvasRef, dispatch, state.clipboard, state.historyIndex, state.history, saveHistory, updateLayers]);

  // Grid rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let drawGrid: (() => void) | null = null;
    if (state.gridEnabled) {
      const gridSize = 20;
      drawGrid = () => {
        const ctx = canvas.getContext();
        const zoom = canvas.getZoom();
        const vpt = canvas.viewportTransform;
        if (!vpt) return;

        const w = canvas.getWidth();
        const h = canvas.getHeight();

        ctx.save();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 0.5;

        const offsetX = vpt[4] % (gridSize * zoom);
        const offsetY = vpt[5] % (gridSize * zoom);

        for (let x = offsetX; x < w; x += gridSize * zoom) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        for (let y = offsetY; y < h; y += gridSize * zoom) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        ctx.restore();
      };
      canvas.on('after:render', drawGrid);
    }

    return () => {
      if (drawGrid) {
        canvas.off('after:render', drawGrid);
      }
    };
  }, [canvasRef, state.gridEnabled]);

  // Pen tool - click to place points, builds a path
  const penPoints = useRef<{ x: number; y: number }[]>([]);
  const penPreviewLine = useRef<Line | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.activeTool !== 'pen') {
      // If switching away from pen, finalize any pending path
      if (penPoints.current.length >= 2 && canvasRef.current) {
        finalizePenPath(canvasRef.current);
      }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePenClick = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button !== 0) return;
      if (opt.target && penPoints.current.length === 0) return; // clicked on object

      const pointer = canvas.getScenePoint(e);
      penPoints.current.push({ x: pointer.x, y: pointer.y });

      // Remove old preview line
      if (penPreviewLine.current) {
        canvas.remove(penPreviewLine.current);
        penPreviewLine.current = null;
      }

      // Draw dots at points
      if (penPoints.current.length === 1) {
        // First point - show a small dot
        const dot = new Ellipse({
          left: pointer.x - 3,
          top: pointer.y - 3,
          rx: 3,
          ry: 3,
          fill: '#7c5cfc',
          selectable: false,
          evented: false,
        });
        (dot as unknown as Record<string, unknown>).isPenHelper = true;
        canvas.add(dot);
        canvas.requestRenderAll();
      }

      if (penPoints.current.length >= 2) {
        // Build path string from points
        const points = penPoints.current;
        let pathStr = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          pathStr += ` L ${points[i].x} ${points[i].y}`;
        }

        // Remove all pen helper objects
        const helpers = canvas.getObjects().filter(
          (o) => (o as unknown as Record<string, unknown>).isPenHelper
        );
        helpers.forEach((h) => canvas.remove(h));

        // Create preview path
        const previewPath = new Path(pathStr, {
          fill: 'transparent',
          stroke: '#7c5cfc',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        (previewPath as unknown as Record<string, unknown>).isPenHelper = true;
        canvas.add(previewPath);
        canvas.requestRenderAll();
      }
    };

    const handlePenMove = (opt: { e: TPointerEvent }) => {
      if (penPoints.current.length === 0) return;
      const e = opt.e as MouseEvent;
      const pointer = canvas.getScenePoint(e);
      const lastPoint = penPoints.current[penPoints.current.length - 1];

      if (penPreviewLine.current) {
        canvas.remove(penPreviewLine.current);
      }
      const line = new Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
        stroke: '#7c5cfc88',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        strokeDashArray: [4, 4],
      });
      (line as unknown as Record<string, unknown>).isPenHelper = true;
      penPreviewLine.current = line;
      canvas.add(line);
      canvas.requestRenderAll();
    };

    const handlePenDblClick = () => {
      if (penPoints.current.length >= 2) {
        finalizePenPath(canvas);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && penPoints.current.length >= 2) {
        finalizePenPath(canvas);
      } else if (e.key === 'Escape') {
        // Cancel pen drawing
        const helpers = canvas.getObjects().filter(
          (o) => (o as unknown as Record<string, unknown>).isPenHelper
        );
        helpers.forEach((h) => canvas.remove(h));
        penPoints.current = [];
        if (penPreviewLine.current) {
          canvas.remove(penPreviewLine.current);
          penPreviewLine.current = null;
        }
        canvas.requestRenderAll();
        dispatch({ type: 'SET_TOOL', tool: 'select' });
      }
    };

    canvas.on('mouse:down', handlePenClick);
    canvas.on('mouse:move', handlePenMove);
    canvas.on('mouse:dblclick', handlePenDblClick);
    window.addEventListener('keydown', handleEscape);

    return () => {
      canvas.off('mouse:down', handlePenClick);
      canvas.off('mouse:move', handlePenMove);
      canvas.off('mouse:dblclick', handlePenDblClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [state.activeTool, canvasRef, dispatch, saveHistory, updateLayers]);

  const finalizePenPath = (canvas: Canvas) => {
    const points = penPoints.current;
    if (points.length < 2) return;

    // Remove all pen helper objects
    const helpers = canvas.getObjects().filter(
      (o) => (o as unknown as Record<string, unknown>).isPenHelper
    );
    helpers.forEach((h) => canvas.remove(h));

    if (penPreviewLine.current) {
      canvas.remove(penPreviewLine.current);
      penPreviewLine.current = null;
    }

    // Build final path
    let pathStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathStr += ` L ${points[i].x} ${points[i].y}`;
    }

    const path = new Path(pathStr, {
      fill: 'transparent',
      stroke: DEFAULT_STROKE,
      strokeWidth: 2,
      strokeUniform: true,
    });
    assignObjectId(path);
    assignDefaultName(path);
    canvas.add(path);
    canvas.setActiveObject(path);
    canvas.requestRenderAll();
    updateLayers();
    saveHistory();
    setShowWelcome(false);

    penPoints.current = [];
    dispatch({ type: 'SET_TOOL', tool: 'select' });
  };

  // Double-click to edit text
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDblClick = (opt: any) => {
      if (opt.target?.type === 'textbox') {
        (opt.target as Textbox).enterEditing();
        canvas.requestRenderAll();
      }
    };

    canvas.on('mouse:dblclick', handleDblClick);
    return () => {
      canvas.off('mouse:dblclick', handleDblClick);
    };
  }, [canvasRef]);

  return (
    <div ref={containerRef} className="flex-1 bg-[#1a1a1a] relative overflow-hidden canvas-container">
      <canvas id="fabric-canvas" />
      <Rulers />
      {showWelcome && state.layers.length === 0 && <WelcomeOverlay />}
    </div>
  );
}

function createStarPoints(cx: number, cy: number, radius: number, points: number) {
  const result = [];
  const outerRadius = radius;
  const innerRadius = radius * 0.4;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    result.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return result;
}
