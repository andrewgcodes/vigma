'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Canvas, FabricObject, Rect, Circle, Ellipse, Triangle, Line, Point } from 'fabric';
import { useEditorStore } from '@/store/useEditorStore';
import Toolbar from './Toolbar';
import LayersPanel from './LayersPanel';
import PropertiesPanel from './PropertiesPanel';
import StatusBar from './StatusBar';
import {
  createRectangle,
  createCircle,
  createEllipse,
  createTriangle,
  createLine,
  createArrow,
  createStar,
  createPolygon,
  createTextbox,
  setupDrawingBrush,
  addImageToCanvas,
  getObjectId,
  getObjectName,
} from '@/lib/canvas-utils';
import type { ToolType, LayerInfo } from '@/types';

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const isDrawingShape = useRef(false);
  const drawStartRef = useRef({ x: 0, y: 0 });
  const tempShapeRef = useRef<FabricObject | null>(null);

  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    setSelectedObjectIds,
    setLayers,
    fillColor,
    strokeColor,
    strokeWidth,
    brushSize,
    brushColor,
    canvasColor,
    showGrid,
    pushHistory,
    undo,
    redo,
  } = useEditorStore();

  const syncLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    const layerInfos: LayerInfo[] = objects.map((obj) => ({
      id: getObjectId(obj),
      name: getObjectName(obj),
      type: obj.type || 'object',
      visible: obj.visible !== false,
      locked: obj.selectable === false,
    }));
    setLayers(layerInfos.reverse());
  }, [setLayers]);

  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toObject(['customId', 'customName']));
    pushHistory(json);
  }, [pushHistory]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const canvas = new Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: canvasColor,
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      if (container && canvas) {
        canvas.setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        canvas.renderAll();
      }
    };
    window.addEventListener('resize', handleResize);

    // Selection events
    canvas.on('selection:created', (e) => {
      const selected = e.selected || [];
      setSelectedObjectIds(selected.map((obj) => getObjectId(obj)));
    });

    canvas.on('selection:updated', (e) => {
      const selected = e.selected || [];
      setSelectedObjectIds(selected.map((obj) => getObjectId(obj)));
    });

    canvas.on('selection:cleared', () => {
      setSelectedObjectIds([]);
    });

    // Object modification events
    canvas.on('object:modified', () => {
      syncLayers();
      saveHistory();
    });

    canvas.on('object:added', () => {
      syncLayers();
    });

    canvas.on('object:removed', () => {
      syncLayers();
      // Only save history for intentional deletions, not temp shape removal during drawing
      if (!isDrawingShape.current) {
        saveHistory();
      }
    });

    // Path created (from drawing) - assign customId/customName
    canvas.on('path:created', (e: { path?: FabricObject }) => {
      if (e.path) {
        const path = e.path as FabricObject & { customId?: string; customName?: string };
        if (!path.customId) {
          path.customId = `path-${Date.now()}`;
          path.customName = `Path`;
        }
      }
      syncLayers();
      saveHistory();
    });

    // Save initial state
    saveHistory();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update canvas background
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.backgroundColor = canvasColor;
    canvas.renderAll();
  }, [canvasColor]);

  // Sync zoom from store to canvas (for StatusBar zoom buttons)
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const currentZoom = Math.round(canvas.getZoom() * 100);
    if (currentZoom !== zoom) {
      const center = canvas.getCenter();
      canvas.zoomToPoint(new Point(center.left, center.top), zoom / 100);
      canvas.renderAll();
    }
  }, [zoom]);

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Reset drawing mode
    canvas.isDrawingMode = activeTool === 'draw';
    canvas.selection = activeTool === 'select';

    if (activeTool === 'draw') {
      setupDrawingBrush(canvas, brushColor, brushSize);
    }

    // Set cursor
    if (activeTool === 'hand') {
      canvas.defaultCursor = 'grab';
      canvas.hoverCursor = 'grab';
    } else if (activeTool === 'draw') {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    } else if (activeTool === 'text') {
      canvas.defaultCursor = 'text';
      canvas.hoverCursor = 'text';
    } else if (['rectangle', 'circle', 'ellipse', 'triangle', 'line', 'arrow', 'star', 'polygon'].includes(activeTool)) {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    } else {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    }
  }, [activeTool, brushColor, brushSize]);

  // Update drawing brush when settings change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || activeTool !== 'draw') return;
    setupDrawingBrush(canvas, brushColor, brushSize);
  }, [brushColor, brushSize, activeTool]);

  // Canvas mouse handlers for shape drawing, panning
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: { e: MouseEvent; pointer?: { x: number; y: number } }) => {
      const e = opt.e;
      const tool = useEditorStore.getState().activeTool;

      // Pan with hand tool or middle mouse
      if (tool === 'hand' || e.button === 1) {
        isPanning.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        canvas.defaultCursor = 'grabbing';
        return;
      }

      // Space + drag for panning
      if (e.altKey) {
        isPanning.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Shape drawing - create shape once in mouseDown
      if (['rectangle', 'circle', 'ellipse', 'triangle', 'line', 'arrow', 'star', 'polygon'].includes(tool)) {
        const pointer = canvas.getScenePoint(e);
        isDrawingShape.current = true;
        drawStartRef.current = { x: pointer.x, y: pointer.y };

        const { fillColor: fc, strokeColor: sc, strokeWidth: sw } = useEditorStore.getState();
        let shape: FabricObject | null = null;

        if (tool === 'rectangle') {
          shape = createRectangle(pointer.x, pointer.y, fc, sc, sw);
          (shape as Rect).set({ width: 0, height: 0 });
        } else if (tool === 'circle') {
          shape = createCircle(pointer.x, pointer.y, fc, sc, sw);
          (shape as Circle).set({ radius: 0 });
        } else if (tool === 'ellipse') {
          shape = createEllipse(pointer.x, pointer.y, fc, sc, sw);
          (shape as Ellipse).set({ rx: 0, ry: 0 });
        } else if (tool === 'triangle') {
          shape = createTriangle(pointer.x, pointer.y, fc, sc, sw);
          (shape as Triangle).set({ width: 0, height: 0 });
        } else if (tool === 'line') {
          shape = createLine([pointer.x, pointer.y, pointer.x, pointer.y], sc || '#ffffff', sw || 2);
        } else if (tool === 'arrow') {
          shape = createArrow([pointer.x, pointer.y, pointer.x, pointer.y], sc || '#ffffff', sw || 2);
        } else if (tool === 'star') {
          shape = createStar(pointer.x, pointer.y, fc, sc, sw);
          shape.scaleX = 0.01;
          shape.scaleY = 0.01;
        } else if (tool === 'polygon') {
          shape = createPolygon(pointer.x, pointer.y, fc, sc, sw);
          shape.scaleX = 0.01;
          shape.scaleY = 0.01;
        }

        if (shape) {
          shape.selectable = false;
          shape.evented = false;
          canvas.add(shape);
          tempShapeRef.current = shape;
          canvas.renderAll();
        }
      }

      // Text tool - click to add
      if (tool === 'text') {
        const pointer = canvas.getScenePoint(e);
        const { fillColor: fc } = useEditorStore.getState();
        const textbox = createTextbox(pointer.x, pointer.y, fc);
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        textbox.enterEditing();
        canvas.renderAll();
        saveHistory();
        setActiveTool('select');
      }
    };

    const handleMouseMove = (opt: { e: MouseEvent }) => {
      const e = opt.e;

      if (isPanning.current) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosRef.current.x;
          vpt[5] += e.clientY - lastPosRef.current.y;
          lastPosRef.current = { x: e.clientX, y: e.clientY };
          canvas.requestRenderAll();
        }
        return;
      }

      if (isDrawingShape.current && tempShapeRef.current) {
        const pointer = canvas.getScenePoint(e);
        const tool = useEditorStore.getState().activeTool;
        const sx = drawStartRef.current.x;
        const sy = drawStartRef.current.y;
        const dx = pointer.x - sx;
        const dy = pointer.y - sy;
        const shape = tempShapeRef.current;

        if (tool === 'rectangle') {
          (shape as Rect).set({
            left: dx >= 0 ? sx : pointer.x,
            top: dy >= 0 ? sy : pointer.y,
            width: Math.abs(dx),
            height: Math.abs(dy),
          });
        } else if (tool === 'circle') {
          const radius = Math.sqrt(dx * dx + dy * dy) / 2;
          (shape as Circle).set({
            left: sx + dx / 2 - radius,
            top: sy + dy / 2 - radius,
            radius,
          });
        } else if (tool === 'ellipse') {
          (shape as Ellipse).set({
            left: dx >= 0 ? sx : pointer.x,
            top: dy >= 0 ? sy : pointer.y,
            rx: Math.abs(dx) / 2,
            ry: Math.abs(dy) / 2,
          });
        } else if (tool === 'triangle') {
          (shape as Triangle).set({
            left: dx >= 0 ? sx : pointer.x,
            top: dy >= 0 ? sy : pointer.y,
            width: Math.abs(dx),
            height: Math.abs(dy),
          });
        } else if (tool === 'line' || tool === 'arrow') {
          (shape as Line).set({ x1: sx, y1: sy, x2: pointer.x, y2: pointer.y });
        } else if (tool === 'star' || tool === 'polygon') {
          const size = Math.max(Math.abs(dx), Math.abs(dy));
          const scaleFactor = size / 120;
          shape.scaleX = scaleFactor || 0.01;
          shape.scaleY = scaleFactor || 0.01;
        }

        shape.setCoords();
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (isPanning.current) {
        isPanning.current = false;
        const tool = useEditorStore.getState().activeTool;
        if (tool === 'hand') {
          canvas.defaultCursor = 'grab';
        }
        return;
      }

      if (isDrawingShape.current && tempShapeRef.current) {
        const shape = tempShapeRef.current;
        shape.selectable = true;
        shape.evented = true;
        canvas.setActiveObject(shape);
        canvas.renderAll();
        tempShapeRef.current = null;
        isDrawingShape.current = false;
        saveHistory();
        setActiveTool('select');
      }
      isDrawingShape.current = false;
    };

    // Zoom with mouse wheel
    const handleWheel = (opt: { e: WheelEvent }) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      let zoomVal = canvas.getZoom();
      zoomVal *= 0.999 ** delta;
      zoomVal = Math.min(Math.max(zoomVal, 0.1), 5);

      canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoomVal);
      setZoom(Math.round(zoomVal * 100));
    };

    canvas.on('mouse:down', handleMouseDown as never);
    canvas.on('mouse:move', handleMouseMove as never);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:wheel', handleWheel as never);

    return () => {
      canvas.off('mouse:down', handleMouseDown as never);
      canvas.off('mouse:move', handleMouseMove as never);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:wheel', handleWheel as never);
    };
  }, [saveHistory, setActiveTool, setZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Don't handle shortcuts when editing text
      const activeObj = canvas.getActiveObject();
      if (activeObj && activeObj.type === 'textbox' && (activeObj as { isEditing?: boolean }).isEditing) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = canvas.getActiveObjects();
        if (selected.length > 0) {
          selected.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          saveHistory();
        }
        e.preventDefault();
      }

      // Ctrl+Z - Undo
      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const state = undo();
        if (state && canvas) {
          canvas.loadFromJSON(JSON.parse(state)).then(() => {
            canvas.renderAll();
            syncLayers();
          });
        }
      }

      // Ctrl+Shift+Z - Redo
      if (isCtrl && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const state = redo();
        if (state && canvas) {
          canvas.loadFromJSON(JSON.parse(state)).then(() => {
            canvas.renderAll();
            syncLayers();
          });
        }
      }

      // Ctrl+A - Select all
      if (isCtrl && e.key === 'a') {
        e.preventDefault();
        const allObjects = canvas.getObjects();
        if (allObjects.length > 0) {
          canvas.discardActiveObject();
          const sel = new (require('fabric').ActiveSelection)(allObjects, { canvas });
          canvas.setActiveObject(sel);
          canvas.requestRenderAll();
        }
      }

      // Ctrl+C - Copy
      if (isCtrl && e.key === 'c') {
        e.preventDefault();
        const active = canvas.getActiveObject();
        if (active) {
          active.clone().then((cloned: FabricObject) => {
            (window as Window & { _vigmaClipboard?: FabricObject })._vigmaClipboard = cloned;
          });
        }
      }

      // Ctrl+V - Paste
      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        const clipboard = (window as Window & { _vigmaClipboard?: FabricObject })._vigmaClipboard;
        if (clipboard) {
          clipboard.clone().then((cloned: FabricObject) => {
            cloned.set({
              left: (cloned.left || 0) + 20,
              top: (cloned.top || 0) + 20,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            saveHistory();
          });
        }
      }

      // Ctrl+D - Duplicate
      if (isCtrl && e.key === 'd') {
        e.preventDefault();
        const active = canvas.getActiveObject();
        if (active) {
          active.clone().then((cloned: FabricObject) => {
            cloned.set({
              left: (cloned.left || 0) + 20,
              top: (cloned.top || 0) + 20,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            saveHistory();
          });
        }
      }

      // Arrow keys - nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const active = canvas.getActiveObject();
        if (active) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          if (e.key === 'ArrowUp') active.set('top', (active.top || 0) - step);
          if (e.key === 'ArrowDown') active.set('top', (active.top || 0) + step);
          if (e.key === 'ArrowLeft') active.set('left', (active.left || 0) - step);
          if (e.key === 'ArrowRight') active.set('left', (active.left || 0) + step);
          active.setCoords();
          canvas.renderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveHistory, syncLayers]);

  // Grid rendering
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (showGrid) {
      canvas.backgroundColor = canvasColor;
      const gridSize = 20;
      const gridCanvas = document.createElement('canvas');
      gridCanvas.width = gridSize;
      gridCanvas.height = gridSize;
      const ctx = gridCanvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(gridSize, 0);
        ctx.lineTo(gridSize, gridSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, gridSize);
        ctx.lineTo(gridSize, gridSize);
        ctx.stroke();
      }
      const pattern = new (require('fabric').Pattern)({
        source: gridCanvas,
        repeat: 'repeat',
      });
      canvas.backgroundColor = pattern;
    } else {
      canvas.backgroundColor = canvasColor;
    }
    canvas.renderAll();
  }, [showGrid, canvasColor]);

  const handleAddShape = useCallback(
    (tool: ToolType) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const center = canvas.getCenter();
      const vpt = canvas.viewportTransform;
      const zoomVal = canvas.getZoom();

      const cx = (center.left - (vpt ? vpt[4] : 0)) / zoomVal;
      const cy = (center.top - (vpt ? vpt[5] : 0)) / zoomVal;

      let shape: FabricObject | null = null;

      switch (tool) {
        case 'rectangle':
          shape = createRectangle(cx - 75, cy - 50, fillColor, strokeColor, strokeWidth);
          break;
        case 'circle':
          shape = createCircle(cx - 60, cy - 60, fillColor, strokeColor, strokeWidth);
          break;
        case 'ellipse':
          shape = createEllipse(cx - 80, cy - 50, fillColor, strokeColor, strokeWidth);
          break;
        case 'triangle':
          shape = createTriangle(cx - 60, cy - 50, fillColor, strokeColor, strokeWidth);
          break;
        case 'star':
          shape = createStar(cx - 60, cy - 60, fillColor, strokeColor, strokeWidth);
          break;
        case 'polygon':
          shape = createPolygon(cx - 60, cy - 60, fillColor, strokeColor, strokeWidth);
          break;
        case 'line':
          shape = createLine([cx - 75, cy, cx + 75, cy], strokeColor || '#ffffff', strokeWidth || 2);
          break;
        case 'arrow':
          shape = createArrow([cx - 75, cy, cx + 75, cy], strokeColor || '#ffffff', strokeWidth || 2);
          break;
        case 'text': {
          const textbox = createTextbox(cx - 100, cy - 15, fillColor);
          canvas.add(textbox);
          canvas.setActiveObject(textbox);
          canvas.renderAll();
          saveHistory();
          return;
        }
      }

      if (shape) {
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.renderAll();
        saveHistory();
      }
    },
    [fillColor, strokeColor, strokeWidth, saveHistory]
  );

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && fabricRef.current) {
        await addImageToCanvas(fabricRef.current, file);
        saveHistory();
      }
    };
    input.click();
  }, [saveHistory]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas-bg">
      <Toolbar
        onAddShape={handleAddShape}
        onImageUpload={handleImageUpload}
        canvas={fabricRef}
      />
      <div className="flex flex-1 overflow-hidden">
        <LayersPanel canvas={fabricRef} />
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
        >
          <canvas ref={canvasRef} />
        </div>
        <PropertiesPanel canvas={fabricRef} />
      </div>
      <StatusBar />
    </div>
  );
}
