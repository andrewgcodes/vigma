'use client';

import { useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';
import { useDesignStore } from '@/store/useDesignStore';
import {
  generateId,
  createRectangle,
  createEllipse,
  createLine,
  createArrow,
  createTriangle,
  createStar,
  createPolygonShape,
  createTextObject,
  createFrame,
  snapToGridValue,
} from '@/utils/canvas-helpers';
import type { ToolType } from '@/types/design';

export function useCanvas() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tempObjectRef = useRef<fabric.FabricObject | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const store = useDesignStore;

  const initCanvas = useCallback((canvasEl: HTMLCanvasElement) => {
    if (canvasRef.current) {
      canvasRef.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasEl, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f5f5f7',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      targetFindTolerance: 5,
    });

    // Configure selection style
    canvas.selectionColor = 'rgba(0, 113, 227, 0.1)';
    canvas.selectionBorderColor = '#0071e3';
    canvas.selectionLineWidth = 1;

    // Configure default object controls
    fabric.FabricObject.prototype.set({
      transparentCorners: false,
      cornerColor: '#0071e3',
      cornerStrokeColor: '#0071e3',
      borderColor: '#0071e3',
      cornerSize: 8,
      cornerStyle: 'circle',
      borderScaleFactor: 1,
      padding: 0,
    });

    // Register custom properties for serialization
    fabric.FabricObject.customProperties = ['customId', 'customName', 'isFrame'];

    canvasRef.current = canvas;

    // Save initial state
    saveHistory();

    return canvas;
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Remove grid lines before saving history, then restore
    const gridObjects = canvas.getObjects().filter((o) => (o as any)._isGrid);
    gridObjects.forEach((o) => canvas.remove(o));
    const json = JSON.stringify(canvas.toJSON());
    gridObjects.forEach((o) => {
      canvas.add(o);
      canvas.sendObjectToBack(o);
    });
    store.getState().pushHistory({
      canvasJSON: json,
      timestamp: Date.now(),
    });
  }, []);

  const restoreFromHistory = useCallback((json: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
    });
  }, []);

  const handleUndo = useCallback(() => {
    const state = store.getState();
    if (!state.canUndo) return;
    state.undo();
    const newState = store.getState();
    const entry = newState.history[newState.historyIndex];
    if (entry) {
      restoreFromHistory(entry.canvasJSON);
    }
  }, [restoreFromHistory]);

  const handleRedo = useCallback(() => {
    const state = store.getState();
    if (!state.canRedo) return;
    state.redo();
    const newState = store.getState();
    const entry = newState.history[newState.historyIndex];
    if (entry) {
      restoreFromHistory(entry.canvasJSON);
    }
  }, [restoreFromHistory]);

  const addShape = useCallback((tool: ToolType, pointer: { x: number; y: number }, size: { w: number; h: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = store.getState();
    const { fillColor, strokeColor, strokeWidth, cornerRadius, opacity } = state;

    let obj: fabric.FabricObject | null = null;

    switch (tool) {
      case 'rectangle':
        obj = createRectangle({
          left: pointer.x,
          top: pointer.y,
          width: Math.abs(size.w),
          height: Math.abs(size.h),
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : 'transparent',
          strokeWidth: strokeWidth,
          rx: cornerRadius,
          ry: cornerRadius,
          opacity: opacity / 100,
        });
        break;
      case 'ellipse':
        obj = createEllipse({
          left: pointer.x,
          top: pointer.y,
          rx: Math.abs(size.w) / 2,
          ry: Math.abs(size.h) / 2,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : 'transparent',
          strokeWidth: strokeWidth,
          opacity: opacity / 100,
        });
        break;
      case 'triangle':
        obj = createTriangle({
          left: pointer.x,
          top: pointer.y,
          width: Math.abs(size.w),
          height: Math.abs(size.h),
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : 'transparent',
          strokeWidth: strokeWidth,
        });
        break;
      case 'line':
        obj = createLine({
          x1: pointer.x,
          y1: pointer.y,
          x2: pointer.x + size.w,
          y2: pointer.y + size.h,
          stroke: strokeColor || '#000000',
          strokeWidth: strokeWidth || 2,
        });
        break;
      case 'arrow':
        obj = createArrow({
          x1: pointer.x,
          y1: pointer.y,
          x2: pointer.x + size.w,
          y2: pointer.y + size.h,
          stroke: strokeColor || '#000000',
          strokeWidth: strokeWidth || 2,
        });
        break;
      case 'polygon':
        obj = createPolygonShape({
          left: pointer.x,
          top: pointer.y,
          radius: Math.max(Math.abs(size.w), Math.abs(size.h)) / 2,
          sides: 6,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : 'transparent',
          strokeWidth: strokeWidth,
        });
        break;
      case 'star':
        obj = createStar({
          left: pointer.x,
          top: pointer.y,
          outerRadius: Math.max(Math.abs(size.w), Math.abs(size.h)) / 2,
          innerRadius: Math.max(Math.abs(size.w), Math.abs(size.h)) / 4,
          points: 5,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : 'transparent',
          strokeWidth: strokeWidth,
        });
        break;
      case 'frame':
        obj = createFrame({
          left: pointer.x,
          top: pointer.y,
          width: Math.abs(size.w) || 200,
          height: Math.abs(size.h) || 200,
        });
        break;
      case 'text':
        obj = createTextObject({
          left: pointer.x,
          top: pointer.y,
          text: 'Type something',
          fontSize: state.fontSize,
          fontFamily: state.fontFamily,
          fontWeight: state.fontWeight,
          fill: fillColor,
        });
        break;
    }

    if (obj) {
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      saveHistory();
    }

    return obj;
  }, [saveHistory]);

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const duplicateSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;

    Promise.all(active.map((obj) =>
      obj.clone().then((cloned: fabric.FabricObject) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        (cloned as any).customId = generateId();
        canvas.add(cloned);
      })
    )).then(() => {
      canvas.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  const groupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeselection') return;

    const objects = (activeObj as fabric.ActiveSelection).getObjects();
    canvas.discardActiveObject();
    objects.forEach((obj) => canvas.remove(obj));
    const group = new fabric.Group(objects);
    (group as any).customId = generateId();
    (group as any).customName = 'Group';
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const ungroupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'group') return;

    const group = activeObj as fabric.Group;
    const items = group.getObjects();
    // Use group's transform matrix to convert each child's group-local
    // left/top to canvas-world left/top BEFORE removing the group
    const groupMatrix = group.calcTransformMatrix();
    const worldPositions = items.map((item) =>
      fabric.util.transformPoint(new fabric.Point(item.left || 0, item.top || 0), groupMatrix)
    );
    canvas.remove(group);
    items.forEach((item, i) => {
      item.set({
        left: worldPositions[i].x,
        top: worldPositions[i].y,
      });
      item.setCoords();
      canvas.add(item);
    });
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const copyToClipboard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: fabric.FabricObject) => {
      store.getState().setClipboard(JSON.stringify(cloned.toJSON()));
    });
  }, []);

  const pasteFromClipboard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const clipboardData = store.getState().clipboard;
    if (!clipboardData) return;

    const parsed = JSON.parse(clipboardData);
    fabric.util.enlivenObjects([parsed]).then((objects) => {
      objects.forEach((obj) => {
        const fabricObj = obj as fabric.FabricObject;
        fabricObj.set({
          left: (fabricObj.left || 0) + 20,
          top: (fabricObj.top || 0) + 20,
        });
        (fabricObj as any).customId = generateId();
        canvas.add(fabricObj);
      });
      canvas.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  const selectAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects().filter((o) => !(o as any)._isGrid);
    if (objects.length === 0) return;
    const selection = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(selection);
    canvas.renderAll();
  }, []);

  const bringForward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringObjectForward(active);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const sendBackward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendObjectBackwards(active);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const bringToFront = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringObjectToFront(active);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const sendToBack = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendObjectToBack(active);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const zoomToFit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects().filter((o) => !(o as any)._isGrid);
    if (objects.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach((obj) => {
      const bounds = obj.getBoundingRect();
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.left + bounds.width);
      maxY = Math.max(maxY, bounds.top + bounds.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const canvasWidth = canvas.width!;
    const canvasHeight = canvas.height!;

    const scaleX = (canvasWidth * 0.9) / contentWidth;
    const scaleY = (canvasHeight * 0.9) / contentHeight;
    const zoom = Math.min(scaleX, scaleY, 5);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.zoomToPoint(new fabric.Point(canvasWidth / 2, canvasHeight / 2), zoom);
    const vpt = canvas.viewportTransform!;
    vpt[4] = canvasWidth / 2 - centerX * zoom;
    vpt[5] = canvasHeight / 2 - centerY * zoom;
    canvas.setViewportTransform(vpt);
    canvas.renderAll();
    store.getState().setZoom(zoom);
  }, []);

  const resetZoom = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
    store.getState().setZoom(1);
  }, []);

  const exportCanvas = useCallback((format: string, scale: number = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Remove grid lines before export, then restore
    const gridObjects = canvas.getObjects().filter((o) => (o as any)._isGrid);
    gridObjects.forEach((o) => canvas.remove(o));
    const restoreGrid = () => {
      gridObjects.forEach((o) => {
        canvas.add(o);
        canvas.sendObjectToBack(o);
      });
      canvas.renderAll();
    };

    if (format === 'json') {
      const json = JSON.stringify(canvas.toJSON(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vigma-design.json';
      a.click();
      URL.revokeObjectURL(url);
      restoreGrid();
      return;
    }

    if (format === 'svg') {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vigma-design.svg';
      a.click();
      URL.revokeObjectURL(url);
      restoreGrid();
      return;
    }

    if (format === 'png') {
      const dataURL = canvas.toDataURL({
        format: 'png',
        multiplier: scale,
      });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'vigma-design.png';
      a.click();
      restoreGrid();
      return;
    }

    if (format === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        const dataURL = canvas.toDataURL({
          format: 'png',
          multiplier: scale,
        });
        const pdf = new jsPDF({
          orientation: canvas.width! > canvas.height! ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width! * scale, canvas.height! * scale],
        });
        pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width! * scale, canvas.height! * scale);
        pdf.save('vigma-design.pdf');
        restoreGrid();
      });
    } else {
      restoreGrid();
    }
  }, []);

  const importJSON = useCallback((jsonString: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.loadFromJSON(jsonString).then(() => {
      canvas.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  const importImage = useCallback((file: File) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      fabric.FabricImage.fromURL(imgUrl).then((img) => {
        const maxSize = 500;
        const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1), 1);
        img.set({
          left: 100,
          top: 100,
          scaleX: scale,
          scaleY: scale,
        });
        (img as any).customId = generateId();
        (img as any).customName = file.name.split('.')[0] || 'Image';
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
  }, [saveHistory]);

  const importSVG = useCallback((svgString: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    fabric.loadSVGFromString(svgString).then((result) => {
      const group = fabric.util.groupSVGElements(result.objects.filter(Boolean) as fabric.FabricObject[]);
      (group as any).customId = generateId();
      (group as any).customName = 'SVG Import';
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  const flipHorizontal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.set('flipX', !active.flipX);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const flipVertical = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.set('flipY', !active.flipY);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const lockObject = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const isLocked = active.lockMovementX;
    active.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockRotation: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      hasControls: isLocked,
    });
    canvas.renderAll();
  }, []);

  return {
    canvasRef,
    initCanvas,
    saveHistory,
    handleUndo,
    handleRedo,
    addShape,
    deleteSelected,
    duplicateSelected,
    groupSelected,
    ungroupSelected,
    copyToClipboard,
    pasteFromClipboard,
    selectAll,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    zoomToFit,
    resetZoom,
    exportCanvas,
    importJSON,
    importImage,
    importSVG,
    flipHorizontal,
    flipVertical,
    lockObject,
    isDrawingRef,
    drawStartRef,
    tempObjectRef,
    isPanningRef,
    lastPanPointRef,
    restoreFromHistory,
  };
}
