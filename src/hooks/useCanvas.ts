'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useStore, type ToolType } from '@/store/useStore';
import { historyManager } from '@/utils/history';

function getObjectName(type: string): string {
  const names: Record<string, string> = {
    rect: 'Rectangle',
    circle: 'Ellipse',
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
    addLayer,
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

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      const tool = activeToolRef.current;

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
        addLayer({ id, name: 'Text', type: 'textbox', visible: true, locked: false });
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
      }

      if (shape) {
        const id = uuidv4();
        (shape as fabric.FabricObject & { id?: string }).id = id;
        (shape as fabric.FabricObject & { name?: string }).name = getObjectName(shape.type || 'object');
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
        const id = (finalObject as fabric.FabricObject & { id?: string }).id || '';
        const name = (finalObject as fabric.FabricObject & { name?: string }).name || 'Object';
        addLayer({
          id,
          name,
          type: finalObject.type || 'object',
          visible: true,
          locked: false,
        });
        currentShape.current = null;
        isDrawing.current = false;
        setActiveTool('select');
      }
    });

    // Snapping
    canvas.on('object:moving', (e) => {
      if (snapToGridRef.current && e.target) {
        const gs = gridSizeRef.current;
        const obj = e.target;
        obj.set({
          left: Math.round((obj.left ?? 0) / gs) * gs,
          top: Math.round((obj.top ?? 0) / gs) * gs,
        });
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
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
  }, [activeTool, fillColor, strokeWidth]);

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
