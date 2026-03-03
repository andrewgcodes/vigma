'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useStore, type ToolType } from '@/store/useStore';
import { historyManager } from '@/utils/history';

function getObjectName(type: string): string {
  const names: Record<string, string> = {
    rect: 'Rectangle',
    ellipse: 'Ellipse',
    triangle: 'Triangle',
    line: 'Line',
    path: 'Path',
    textbox: 'Text',
    image: 'Image',
    polygon: 'Polygon',
    polyline: 'Arrow',
    group: 'Group',
  };
  return names[type] || 'Object';
}

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const drawStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentShape = useRef<fabric.FabricObject | null>(null);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const {
    activeTool,
    setActiveTool,
    setZoom,
    setSelectedObjectIds,
    setLayers,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity,
    fontSize,
    fontFamily,
    setCanUndo,
    setCanRedo,
    showGrid,
    gridSize,
    snapToGrid,
    setContextMenu,
    previousTool,
    setFillColor,
  } = useStore();

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const fillColorRef = useRef(fillColor);
  fillColorRef.current = fillColor;
  const strokeColorRef = useRef(strokeColor);
  strokeColorRef.current = strokeColor;
  const strokeWidthRef = useRef(strokeWidth);
  strokeWidthRef.current = strokeWidth;
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;
  const fontSizeRef = useRef(fontSize);
  fontSizeRef.current = fontSize;
  const fontFamilyRef = useRef(fontFamily);
  fontFamilyRef.current = fontFamily;
  const snapToGridRef = useRef(snapToGrid);
  snapToGridRef.current = snapToGrid;
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;
  const previousToolRef = useRef(previousTool);
  previousToolRef.current = previousTool;
  const setFillColorRef = useRef(setFillColor);
  setFillColorRef.current = setFillColor;
  const setContextMenuRef = useRef(setContextMenu);
  setContextMenuRef.current = setContextMenu;

  const syncLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    const layers = objects
      .filter((obj) => (obj as fabric.FabricObject & { id?: string }).id)
      .map((obj) => {
        const fObj = obj as fabric.FabricObject & { id?: string; name?: string };
        return {
          id: fObj.id || '',
          name: fObj.name || getObjectName(obj.type || 'object'),
          type: obj.type || 'object',
          visible: obj.visible !== false,
          locked: !obj.selectable,
        };
      })
      .reverse();
    setLayers(layers);
  }, [setLayers]);

  const saveHistory = useCallback(() => {
    historyManager.saveState();
  }, []);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f8f9fa',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    canvas.selectionColor = 'rgba(79, 70, 229, 0.08)';
    canvas.selectionBorderColor = '#4F46E5';
    canvas.selectionLineWidth = 1;

    fabric.FabricObject.prototype.set({
      transparentCorners: false,
      cornerColor: '#4F46E5',
      cornerStrokeColor: '#4F46E5',
      cornerSize: 8,
      cornerStyle: 'circle',
      borderColor: '#4F46E5',
      borderScaleFactor: 1.5,
      padding: 4,
    });

    // Register custom properties so they survive toJSON/loadFromJSON round-trips
    fabric.FabricObject.customProperties = ['id', 'name'];

    fabricRef.current = canvas;
    historyManager.init(canvas);
    historyManager.onChange((canUndo, canRedo) => {
      setCanUndo(canUndo);
      setCanRedo(canRedo);
    });
    historyManager.onRestore(() => {
      syncLayers();
    });

    canvas.on('selection:created', () => {
      const active = canvas.getActiveObject();
      if (active) {
        const ids: string[] = [];
        if (active.type === 'activeselection') {
          (active as fabric.ActiveSelection).getObjects().forEach((obj) => {
            const id = (obj as fabric.FabricObject & { id?: string }).id;
            if (id) ids.push(id);
          });
        } else {
          const id = (active as fabric.FabricObject & { id?: string }).id;
          if (id) ids.push(id);
        }
        setSelectedObjectIds(ids);
      }
    });

    canvas.on('selection:updated', () => {
      const active = canvas.getActiveObject();
      if (active) {
        const ids: string[] = [];
        if (active.type === 'activeselection') {
          (active as fabric.ActiveSelection).getObjects().forEach((obj) => {
            const id = (obj as fabric.FabricObject & { id?: string }).id;
            if (id) ids.push(id);
          });
        } else {
          const id = (active as fabric.FabricObject & { id?: string }).id;
          if (id) ids.push(id);
        }
        setSelectedObjectIds(ids);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedObjectIds([]);
    });

    canvas.on('object:modified', () => {
      syncLayers();
      saveHistory();
    });

    canvas.on('object:added', () => {
      syncLayers();
    });

    canvas.on('object:removed', () => {
      syncLayers();
    });

    // Assign id/name to freehand pen paths so they appear in layers panel
    canvas.on('path:created', (opt: { path: fabric.FabricObject }) => {
      const path = opt.path;
      const id = uuidv4();
      (path as fabric.FabricObject & { id?: string }).id = id;
      (path as fabric.FabricObject & { name?: string }).name = 'Path';
      syncLayers();
      saveHistory();
    });

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom() * (0.999 ** delta);
      if (newZoom > 5) newZoom = 5;
      if (newZoom < 0.1) newZoom = 0.1;

      canvas.zoomToPoint(
        new fabric.Point(opt.e.offsetX, opt.e.offsetY),
        newZoom
      );
      setZoom(Math.round(newZoom * 100));
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Right-click context menu via native DOM event (more reliable than Fabric.js mouse:down for right-click)
    const upperCanvas = canvas.upperCanvasEl;
    const handleContextMenu = (evt: Event) => {
      const e = evt as MouseEvent;
      e.preventDefault();
      e.stopPropagation();
      const active = canvas.getActiveObject();
      const targetId = active ? (active as fabric.FabricObject & { id?: string }).id || null : null;
      setContextMenuRef.current({ x: e.clientX, y: e.clientY, objectId: targetId });
    };
    upperCanvas.addEventListener('contextmenu', handleContextMenu);

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if (evt.button === 2) return; // handled above
      const tool = activeToolRef.current;

      // Eyedropper tool
      if (tool === 'eyedropper') {
        const pointer = canvas.getScenePoint(evt);
        const objects = canvas.getObjects();
        for (let i = objects.length - 1; i >= 0; i--) {
          const obj = objects[i];
          if (obj.containsPoint(pointer) && (obj as fabric.FabricObject & { id?: string }).id) {
            const fill = obj.fill;
            const color = typeof fill === 'string' ? fill : '#000000';
            setFillColorRef.current(color);
            break;
          }
        }
        setActiveTool(previousToolRef.current || 'select');
        return;
      }

      if (tool === 'hand' || (evt.altKey && tool === 'select')) {
        isPanning.current = true;
        lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
        canvas.selection = false;
        canvas.setCursor('grab');
        return;
      }

      if (tool === 'select') return;

      if (tool === 'pen') return;

      const pointer = canvas.getScenePoint(opt.e);
      isDrawing.current = true;
      drawStart.current = { x: pointer.x, y: pointer.y };

      if (tool === 'text') {
        const text = new fabric.Textbox('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontSize: fontSizeRef.current,
          fontFamily: fontFamilyRef.current,
          fill: fillColorRef.current,
          width: 200,
          editable: true,
        });
        const id = uuidv4();
        (text as fabric.FabricObject & { id?: string }).id = id;
        (text as fabric.FabricObject & { name?: string }).name = 'Text';
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        isDrawing.current = false;
        // syncLayers() already ran via the object:added event, no need for addLayer
        saveHistory();
        setActiveTool('select');
        return;
      }

      let shape: fabric.FabricObject | null = null;

      if (tool === 'rectangle') {
        shape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColorRef.current,
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          opacity: opacityRef.current / 100,
          rx: 0,
          ry: 0,
        });
      } else if (tool === 'ellipse') {
        shape = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: fillColorRef.current,
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          opacity: opacityRef.current / 100,
        });
      } else if (tool === 'triangle') {
        shape = new fabric.Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColorRef.current,
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          opacity: opacityRef.current / 100,
        });
      } else if (tool === 'line' || tool === 'arrow') {
        shape = new fabric.Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: strokeColorRef.current,
            strokeWidth: Math.max(strokeWidthRef.current, 2),
            opacity: opacityRef.current / 100,
          }
        );
      } else if (tool === 'star') {
        shape = createStar(pointer.x, pointer.y, 0, fillColorRef.current, strokeColorRef.current, strokeWidthRef.current, opacityRef.current);
      } else if (tool === 'polygon') {
        shape = createHexagon(pointer.x, pointer.y, 0, fillColorRef.current, strokeColorRef.current, strokeWidthRef.current, opacityRef.current);
      } else if (tool === 'frame') {
        shape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: '#ffffff',
          stroke: '#cccccc',
          strokeWidth: 1,
          opacity: 1,
          rx: 0,
          ry: 0,
        });
      }

      if (shape) {
        const id = uuidv4();
        (shape as fabric.FabricObject & { id?: string }).id = id;
        (shape as fabric.FabricObject & { name?: string }).name = activeToolRef.current === 'frame' ? 'Frame' : getObjectName(shape.type || 'object');
        currentShape.current = shape;
        canvas.add(shape);
        canvas.renderAll();
      }
    });

    canvas.on('mouse:move', (opt) => {
      const evt = opt.e as MouseEvent;

      if (isPanning.current) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPanPoint.current.x;
          vpt[5] += evt.clientY - lastPanPoint.current.y;
          canvas.requestRenderAll();
          lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
        }
        return;
      }

      if (!isDrawing.current || !currentShape.current) return;

      const pointer = canvas.getScenePoint(opt.e);
      const tool = activeToolRef.current;

      if (tool === 'rectangle') {
        const rect = currentShape.current as fabric.Rect;
        const w = Math.abs(pointer.x - drawStart.current.x);
        const h = Math.abs(pointer.y - drawStart.current.y);
        rect.set({
          left: Math.min(pointer.x, drawStart.current.x),
          top: Math.min(pointer.y, drawStart.current.y),
          width: w,
          height: h,
        });
      } else if (tool === 'ellipse') {
        const ellipse = currentShape.current as fabric.Ellipse;
        const rx = Math.abs(pointer.x - drawStart.current.x) / 2;
        const ry = Math.abs(pointer.y - drawStart.current.y) / 2;
        ellipse.set({
          left: Math.min(pointer.x, drawStart.current.x),
          top: Math.min(pointer.y, drawStart.current.y),
          rx,
          ry,
        });
      } else if (tool === 'triangle') {
        const tri = currentShape.current as fabric.Triangle;
        const w = Math.abs(pointer.x - drawStart.current.x);
        const h = Math.abs(pointer.y - drawStart.current.y);
        tri.set({
          left: Math.min(pointer.x, drawStart.current.x),
          top: Math.min(pointer.y, drawStart.current.y),
          width: w,
          height: h,
        });
      } else if (tool === 'frame') {
        const rect = currentShape.current as fabric.Rect;
        const w = Math.abs(pointer.x - drawStart.current.x);
        const h = Math.abs(pointer.y - drawStart.current.y);
        rect.set({
          left: Math.min(pointer.x, drawStart.current.x),
          top: Math.min(pointer.y, drawStart.current.y),
          width: w,
          height: h,
        });
      } else if (tool === 'line' || tool === 'arrow') {
        const line = currentShape.current as fabric.Line;
        line.set({ x2: pointer.x, y2: pointer.y });
      } else if (tool === 'star') {
        const size = Math.max(
          Math.abs(pointer.x - drawStart.current.x),
          Math.abs(pointer.y - drawStart.current.y)
        );
        canvas.remove(currentShape.current);
        const newStar = createStar(
          drawStart.current.x, drawStart.current.y, size / 2,
          fillColorRef.current, strokeColorRef.current,
          strokeWidthRef.current, opacityRef.current
        );
        const id = (currentShape.current as fabric.FabricObject & { id?: string }).id;
        (newStar as fabric.FabricObject & { id?: string }).id = id;
        (newStar as fabric.FabricObject & { name?: string }).name = 'Star';
        currentShape.current = newStar;
        canvas.add(newStar);
      } else if (tool === 'polygon') {
        const size = Math.max(
          Math.abs(pointer.x - drawStart.current.x),
          Math.abs(pointer.y - drawStart.current.y)
        );
        canvas.remove(currentShape.current);
        const newHex = createHexagon(
          drawStart.current.x, drawStart.current.y, size / 2,
          fillColorRef.current, strokeColorRef.current,
          strokeWidthRef.current, opacityRef.current
        );
        const id = (currentShape.current as fabric.FabricObject & { id?: string }).id;
        (newHex as fabric.FabricObject & { id?: string }).id = id;
        (newHex as fabric.FabricObject & { name?: string }).name = 'Polygon';
        currentShape.current = newHex;
        canvas.add(newHex);
      }

      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (isPanning.current) {
        isPanning.current = false;
        const tool = activeToolRef.current;
        if (tool === 'select') {
          canvas.selection = true;
          canvas.setCursor('default');
        } else if (tool === 'hand') {
          canvas.selection = false;
          canvas.setCursor('grab');
        } else {
          canvas.selection = false;
          canvas.setCursor('crosshair');
        }
        return;
      }

      if (isDrawing.current && currentShape.current) {
        const tool = activeToolRef.current;
        let finalObject: fabric.FabricObject = currentShape.current;

        if (tool === 'arrow') {
          const line = currentShape.current as fabric.Line;
          const arrowGroup = createArrowGroup(canvas, line);
          if (arrowGroup) {
            // Transfer id and name from the line to the group
            const lineId = (line as fabric.FabricObject & { id?: string }).id;
            (arrowGroup as fabric.FabricObject & { id?: string }).id = lineId;
            (arrowGroup as fabric.FabricObject & { name?: string }).name = 'Arrow';
            finalObject = arrowGroup;
          }
        }

        canvas.setActiveObject(finalObject);
        saveHistory();
        // syncLayers() already ran via the object:added event, no need for addLayer
        currentShape.current = null;
        isDrawing.current = false;
        setActiveTool('select');
      }
    });

    // Snapping + Smart Guides
    canvas.on('object:moving', (e) => {
      if (snapToGridRef.current && e.target) {
        const gs = gridSizeRef.current;
        const obj = e.target;
        obj.set({
          left: Math.round((obj.left ?? 0) / gs) * gs,
          top: Math.round((obj.top ?? 0) / gs) * gs,
        });
      }
      // Smart guides
      if (e.target) {
        showSmartGuides(canvas, e.target);
      }
    });

    canvas.on('object:modified', () => {
      removeSmartGuides(canvas);
    });

    canvas.on('mouse:up', () => {
      removeSmartGuides(canvas);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      upperCanvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (activeTool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = fillColor;
      canvas.freeDrawingBrush.width = Math.max(strokeWidth, 2);
      canvas.selection = false;
    } else {
      canvas.isDrawingMode = false;
      if (activeTool === 'select') {
        canvas.selection = true;
        canvas.setCursor('default');
      } else if (activeTool === 'hand') {
        canvas.selection = false;
        canvas.setCursor('grab');
      } else {
        canvas.selection = false;
        canvas.setCursor('crosshair');
      }
    }
  }, [activeTool, fillColor, strokeWidth, setActiveTool]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (showGrid) {
      drawGrid(canvas, gridSize);
    } else {
      removeGrid(canvas);
    }
  }, [showGrid, gridSize]);

  return { canvasRef, fabricRef };
}

function createStar(
  cx: number, cy: number, outerRadius: number,
  fill: string, stroke: string, strokeW: number, opacityVal: number
): fabric.Polygon {
  const points: fabric.XY[] = [];
  const spikes = 5;
  const innerRadius = outerRadius * 0.4;
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  return new fabric.Polygon(points, {
    fill,
    stroke,
    strokeWidth: strokeW,
    opacity: opacityVal / 100,
  });
}

function createHexagon(
  cx: number, cy: number, radius: number,
  fill: string, stroke: string, strokeW: number, opacityVal: number
): fabric.Polygon {
  const points: fabric.XY[] = [];
  const sides = 6;

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }

  return new fabric.Polygon(points, {
    fill,
    stroke,
    strokeWidth: strokeW,
    opacity: opacityVal / 100,
  });
}

function createArrowGroup(canvas: fabric.Canvas, line: fabric.Line): fabric.Group | null {
  const x1 = line.x1 ?? 0;
  const y1 = line.y1 ?? 0;
  const x2 = line.x2 ?? 0;
  const y2 = line.y2 ?? 0;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 15;

  const points = [
    { x: x2, y: y2 },
    {
      x: x2 - headLen * Math.cos(angle - Math.PI / 6),
      y: y2 - headLen * Math.sin(angle - Math.PI / 6),
    },
    {
      x: x2 - headLen * Math.cos(angle + Math.PI / 6),
      y: y2 - headLen * Math.sin(angle + Math.PI / 6),
    },
  ];

  const arrowHead = new fabric.Polygon(points, {
    fill: line.stroke as string,
    stroke: line.stroke as string,
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });

  // Remove the standalone line from canvas and group it with the arrowhead
  canvas.remove(line);
  const group = new fabric.Group([line, arrowHead], {
    left: line.left,
    top: line.top,
  });

  canvas.add(group);
  return group;
}

function drawGrid(canvas: fabric.Canvas, gridSize: number) {
  removeGrid(canvas);
  const width = canvas.width ?? 4000;
  const height = canvas.height ?? 4000;

  for (let i = 0; i < width / gridSize; i++) {
    const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
      stroke: '#e5e7eb',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (line as fabric.FabricObject & { isGrid?: boolean }).isGrid = true;
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }
  for (let i = 0; i < height / gridSize; i++) {
    const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
      stroke: '#e5e7eb',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (line as fabric.FabricObject & { isGrid?: boolean }).isGrid = true;
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }
  canvas.renderAll();
}

function removeGrid(canvas: fabric.Canvas) {
  const gridLines = canvas.getObjects().filter(
    (obj) => (obj as fabric.FabricObject & { isGrid?: boolean }).isGrid
  );
  gridLines.forEach((line) => canvas.remove(line));
  canvas.renderAll();
}

function showSmartGuides(canvas: fabric.Canvas, target: fabric.FabricObject) {
  removeSmartGuides(canvas);
  const SNAP_THRESHOLD = 5;
  const targetBounds = target.getBoundingRect();
  const targetCenterX = targetBounds.left + targetBounds.width / 2;
  const targetCenterY = targetBounds.top + targetBounds.height / 2;
  const targetRight = targetBounds.left + targetBounds.width;
  const targetBottom = targetBounds.top + targetBounds.height;

  const objects = canvas.getObjects().filter((obj) => {
    if (obj === target) return false;
    if ((obj as fabric.FabricObject & { isGrid?: boolean }).isGrid) return false;
    if ((obj as fabric.FabricObject & { isSmartGuide?: boolean }).isSmartGuide) return false;
    return true;
  });

  const canvasWidth = canvas.width ?? 2000;
  const canvasHeight = canvas.height ?? 2000;

  // Two-pass approach: collect all snap candidates, then apply only the closest per axis
  let bestSnapX: { dist: number; delta: number; guidePos: number; isCenter: boolean } | null = null;
  let bestSnapY: { dist: number; delta: number; guidePos: number; isCenter: boolean } | null = null;

  for (const obj of objects) {
    const bounds = obj.getBoundingRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const objRight = bounds.left + bounds.width;
    const objBottom = bounds.top + bounds.height;

    // X-axis candidates: center, left edge, right edge
    const xCandidates = [
      { dist: Math.abs(targetCenterX - centerX), delta: centerX - targetCenterX, guidePos: centerX, isCenter: true },
      { dist: Math.abs(targetBounds.left - bounds.left), delta: bounds.left - targetBounds.left, guidePos: bounds.left, isCenter: false },
      { dist: Math.abs(targetRight - objRight), delta: objRight - targetRight, guidePos: objRight, isCenter: false },
    ];

    for (const candidate of xCandidates) {
      if (candidate.dist < SNAP_THRESHOLD && (!bestSnapX || candidate.dist < bestSnapX.dist)) {
        bestSnapX = candidate;
      }
    }

    // Y-axis candidates: center, top edge, bottom edge
    const yCandidates = [
      { dist: Math.abs(targetCenterY - centerY), delta: centerY - targetCenterY, guidePos: centerY, isCenter: true },
      { dist: Math.abs(targetBounds.top - bounds.top), delta: bounds.top - targetBounds.top, guidePos: bounds.top, isCenter: false },
      { dist: Math.abs(targetBottom - objBottom), delta: objBottom - targetBottom, guidePos: objBottom, isCenter: false },
    ];

    for (const candidate of yCandidates) {
      if (candidate.dist < SNAP_THRESHOLD && (!bestSnapY || candidate.dist < bestSnapY.dist)) {
        bestSnapY = candidate;
      }
    }
  }

  // Apply the best snap per axis and create guide lines
  const guideLines: fabric.Line[] = [];

  const zoom = canvas.getZoom();

  if (bestSnapX) {
    target.set('left', (target.left ?? 0) + bestSnapX.delta / zoom);
    const guide = new fabric.Line([bestSnapX.guidePos, 0, bestSnapX.guidePos, canvasHeight], {
      stroke: '#FF69B4', strokeWidth: bestSnapX.isCenter ? 1 : 0.5,
      strokeDashArray: bestSnapX.isCenter ? [4, 4] : [2, 2],
      selectable: false, evented: false, excludeFromExport: true,
    });
    (guide as fabric.FabricObject & { isSmartGuide?: boolean }).isSmartGuide = true;
    guideLines.push(guide);
  }

  if (bestSnapY) {
    target.set('top', (target.top ?? 0) + bestSnapY.delta / zoom);
    const guide = new fabric.Line([0, bestSnapY.guidePos, canvasWidth, bestSnapY.guidePos], {
      stroke: '#FF69B4', strokeWidth: bestSnapY.isCenter ? 1 : 0.5,
      strokeDashArray: bestSnapY.isCenter ? [4, 4] : [2, 2],
      selectable: false, evented: false, excludeFromExport: true,
    });
    (guide as fabric.FabricObject & { isSmartGuide?: boolean }).isSmartGuide = true;
    guideLines.push(guide);
  }

  guideLines.forEach((g) => canvas.add(g));
  if (guideLines.length > 0) {
    target.setCoords();
    canvas.renderAll();
  }
}

function removeSmartGuides(canvas: fabric.Canvas) {
  const guides = canvas.getObjects().filter(
    (obj) => (obj as fabric.FabricObject & { isSmartGuide?: boolean }).isSmartGuide
  );
  if (guides.length > 0) {
    guides.forEach((g) => canvas.remove(g));
    canvas.renderAll();
  }
}
