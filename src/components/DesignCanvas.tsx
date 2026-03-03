'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { useDesignStore } from '@/store/useDesignStore';
import { useCanvas } from '@/hooks/useCanvas';
import { useKeyboard } from '@/hooks/useKeyboard';
import { snapToGridValue, generateId } from '@/utils/canvas-helpers';

function getClientXY(e: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
  if ('clientX' in e) return { x: e.clientX, y: e.clientY };
  if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if ('changedTouches' in e && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: 0, y: 0 };
}
import TopBar from './TopBar';
import Toolbar from './Toolbar';
import LayersPanel from './LayersPanel';
import PropertiesPanel from './PropertiesPanel';
import PagesPanel from './PagesPanel';
import ExportPanel from './ExportPanel';
import ContextMenu from './ContextMenu';
import Notification from './Notification';
import Rulers from './Rulers';

export default function DesignCanvas() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 800 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const {
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
  } = useCanvas();

  const activeTool = useDesignStore((s) => s.activeTool);
  const setActiveTool = useDesignStore((s) => s.setActiveTool);
  const zoom = useDesignStore((s) => s.zoom);
  const setZoom = useDesignStore((s) => s.setZoom);
  const showGrid = useDesignStore((s) => s.showGrid);
  const gridSize = useDesignStore((s) => s.gridSize);
  const snapToGrid = useDesignStore((s) => s.snapToGrid);
  const leftPanelOpen = useDesignStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useDesignStore((s) => s.rightPanelOpen);
  const leftPanelTab = useDesignStore((s) => s.leftPanelTab);
  const rightPanelTab = useDesignStore((s) => s.rightPanelTab);
  const setLeftPanelTab = useDesignStore((s) => s.setLeftPanelTab);
  const setRightPanelTab = useDesignStore((s) => s.setRightPanelTab);
  const setContextMenuPosition = useDesignStore((s) => s.setContextMenuPosition);
  const showNotification = useDesignStore((s) => s.showNotification);
  const fillColor = useDesignStore((s) => s.fillColor);
  const strokeColor = useDesignStore((s) => s.strokeColor);
  const strokeWidth = useDesignStore((s) => s.strokeWidth);

  // Keyboard shortcuts
  useKeyboard({
    handleUndo,
    handleRedo,
    deleteSelected,
    duplicateSelected,
    copyToClipboard,
    pasteFromClipboard,
    selectAll,
    groupSelected,
    ungroupSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    zoomToFit,
    resetZoom,
    flipHorizontal,
    flipVertical,
    lockObject,
    exportCanvas,
  });

  // Initialize canvas
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = initCanvas(canvasElRef.current);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.setDimensions({ width: w, height: h });
      setCanvasSize({ w, h });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [initCanvas]);

  // Drawing tools - mouse down
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
      const pointer = canvas.getScenePoint(opt.e);
      const tool = useDesignStore.getState().activeTool;

      // Context menu
      if (opt.e instanceof MouseEvent && opt.e.button === 2) {
        opt.e.preventDefault();
        const pos = getClientXY(opt.e);
        setContextMenuPosition({ x: pos.x, y: pos.y });
        return;
      }

      // Close context menu on left click
      setContextMenuPosition(null);

      // Hand tool
      if (tool === 'hand' || (opt.e instanceof MouseEvent && opt.e.button === 1)) {
        isPanningRef.current = true;
        lastPanPointRef.current = getClientXY(opt.e);
        canvas.setCursor('grabbing');
        canvas.selection = false;
        return;
      }

      // Space + drag for pan
      if (opt.e instanceof KeyboardEvent) return;

      // Pencil / freehand drawing
      if (tool === 'pencil') {
        canvas.isDrawingMode = true;
        const brush = new fabric.PencilBrush(canvas);
        brush.color = useDesignStore.getState().strokeColor || '#000000';
        brush.width = useDesignStore.getState().strokeWidth || 2;
        canvas.freeDrawingBrush = brush;
        return;
      }

      // Eraser
      if (tool === 'eraser') {
        canvas.isDrawingMode = true;
        const brush = new fabric.PencilBrush(canvas);
        brush.color = '#f5f5f7'; // canvas bg color
        brush.width = 20;
        canvas.freeDrawingBrush = brush;
        return;
      }

      // Eyedropper
      if (tool === 'eyedropper') {
        const activeObj = canvas.getActiveObject();
        const objects = canvas.getObjects();
        // Find the topmost object at pointer
        let pickedColor = '#000000';
        for (let i = objects.length - 1; i >= 0; i--) {
          const obj = objects[i];
          if (obj.containsPoint(pointer)) {
            if (typeof obj.fill === 'string') {
              pickedColor = obj.fill;
            }
            break;
          }
        }
        useDesignStore.getState().setFillColor(pickedColor);
        showNotification(`Color picked: ${pickedColor}`, 'info');
        setActiveTool('select');
        return;
      }

      // Image tool - trigger file input
      if (tool === 'image') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) importImage(file);
        };
        input.click();
        setActiveTool('select');
        return;
      }

      // Select tool - let Fabric.js handle it
      if (tool === 'select') {
        return;
      }

      // Shape/text drawing
      const shapeTool = ['rectangle', 'ellipse', 'line', 'arrow', 'triangle', 'polygon', 'star', 'frame', 'text', 'pen'];
      if (shapeTool.includes(tool)) {
        if (tool === 'text') {
          addShape('text', pointer, { w: 200, h: 30 });
          setActiveTool('select');
          return;
        }

        isDrawingRef.current = true;
        drawStartRef.current = { x: pointer.x, y: pointer.y };

        // For pen tool, collect points for a custom path
        if (tool === 'pen') {
          return;
        }

        // Create temporary shape preview
        const state = useDesignStore.getState();
        let tempObj: fabric.FabricObject | null = null;

        switch (tool) {
          case 'rectangle':
          case 'frame':
            tempObj = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              fill: tool === 'frame' ? '#ffffff' : state.fillColor,
              stroke: tool === 'frame' ? '#cccccc' : (state.strokeWidth > 0 ? state.strokeColor : 'transparent'),
              strokeWidth: tool === 'frame' ? 1 : state.strokeWidth,
              rx: tool === 'frame' ? 0 : state.cornerRadius,
              ry: tool === 'frame' ? 0 : state.cornerRadius,
              selectable: false,
              evented: false,
              opacity: tool === 'frame' ? 1 : state.opacity / 100,
            });
            break;
          case 'ellipse':
            tempObj = new fabric.Ellipse({
              left: pointer.x,
              top: pointer.y,
              rx: 0,
              ry: 0,
              fill: state.fillColor,
              stroke: state.strokeWidth > 0 ? state.strokeColor : 'transparent',
              strokeWidth: state.strokeWidth,
              selectable: false,
              evented: false,
              opacity: state.opacity / 100,
            });
            break;
          case 'triangle':
            tempObj = new fabric.Triangle({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              fill: state.fillColor,
              stroke: state.strokeWidth > 0 ? state.strokeColor : 'transparent',
              strokeWidth: state.strokeWidth,
              selectable: false,
              evented: false,
            });
            break;
          case 'line':
          case 'arrow':
            tempObj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: state.strokeColor || '#000000',
              strokeWidth: state.strokeWidth || 2,
              selectable: false,
              evented: false,
            });
            break;
          case 'polygon':
          case 'star':
            tempObj = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              fill: 'transparent',
              stroke: state.fillColor,
              strokeWidth: 1,
              strokeDashArray: [4, 4],
              selectable: false,
              evented: false,
            });
            break;
        }

        if (tempObj) {
          canvas.add(tempObj);
          tempObjectRef.current = tempObj;
        }
      }
    };

    const handleMouseMove = (opt: fabric.TPointerEventInfo) => {
      const pointer = canvas.getScenePoint(opt.e);

      // Panning
      if (isPanningRef.current) {
        const clientPos = getClientXY(opt.e);
        const dx = clientPos.x - lastPanPointRef.current.x;
        const dy = clientPos.y - lastPanPointRef.current.y;
        const vpt = canvas.viewportTransform!;
        vpt[4] += dx;
        vpt[5] += dy;
        canvas.setViewportTransform(vpt);
        lastPanPointRef.current = clientPos;
        setPanOffset({ x: vpt[4], y: vpt[5] });
        canvas.renderAll();
        return;
      }

      // Drawing shapes
      if (isDrawingRef.current && tempObjectRef.current) {
        const startX = drawStartRef.current.x;
        const startY = drawStartRef.current.y;
        let w = pointer.x - startX;
        let h = pointer.y - startY;

        // Shift to maintain aspect ratio
        if (opt.e instanceof MouseEvent && opt.e.shiftKey) {
          const size = Math.max(Math.abs(w), Math.abs(h));
          w = w < 0 ? -size : size;
          h = h < 0 ? -size : size;
        }

        const tool = useDesignStore.getState().activeTool;
        const temp = tempObjectRef.current;

        if (tool === 'line' || tool === 'arrow') {
          (temp as fabric.Line).set({
            x2: pointer.x,
            y2: pointer.y,
          });
        } else if (tool === 'ellipse') {
          const left = w < 0 ? startX + w : startX;
          const top = h < 0 ? startY + h : startY;
          (temp as fabric.Ellipse).set({
            left,
            top,
            rx: Math.abs(w) / 2,
            ry: Math.abs(h) / 2,
          });
        } else {
          const left = w < 0 ? startX + w : startX;
          const top = h < 0 ? startY + h : startY;
          temp.set({
            left,
            top,
            width: Math.abs(w),
            height: Math.abs(h),
          });
        }

        canvas.renderAll();
      }
    };

    const handleMouseUp = (opt: fabric.TPointerEventInfo) => {
      // Stop panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        const tool = useDesignStore.getState().activeTool;
        canvas.setCursor(tool === 'hand' ? 'grab' : 'default');
        canvas.selection = tool === 'select';
        return;
      }

      // Finish drawing
      if (isDrawingRef.current && tempObjectRef.current) {
        const pointer = canvas.getScenePoint(opt.e);
        const startX = drawStartRef.current.x;
        const startY = drawStartRef.current.y;
        let w = pointer.x - startX;
        let h = pointer.y - startY;

        // Remove temp object
        canvas.remove(tempObjectRef.current);
        tempObjectRef.current = null;
        isDrawingRef.current = false;

        // Min size check
        if (Math.abs(w) < 3 && Math.abs(h) < 3) {
          w = 100;
          h = 100;
        }

        const tool = useDesignStore.getState().activeTool;
        const left = w < 0 ? startX + w : startX;
        const top = h < 0 ? startY + h : startY;

        addShape(tool, { x: left, y: top }, { w: Math.abs(w), h: Math.abs(h) });

        // Switch back to select after creating shape
        setActiveTool('select');
      }
    };

    // Zoom with scroll wheel
    const handleWheel = (opt: fabric.TPointerEventInfo<WheelEvent>) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      // Pinch zoom or ctrl+scroll
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY;
        let newZoom = canvas.getZoom() * (1 - delta / 300);
        newZoom = Math.max(0.01, Math.min(64, newZoom));
        const point = new fabric.Point(e.offsetX, e.offsetY);
        canvas.zoomToPoint(point, newZoom);
        setZoom(newZoom);
      } else {
        // Pan
        const vpt = canvas.viewportTransform!;
        vpt[4] -= e.deltaX;
        vpt[5] -= e.deltaY;
        canvas.setViewportTransform(vpt);
        setPanOffset({ x: vpt[4], y: vpt[5] });
      }
      canvas.renderAll();
    };

    // Selection events
    const handleSelectionCreated = () => {
      const activeObjects = canvas.getActiveObjects();
      const ids = activeObjects.map((o) => (o as any).customId).filter(Boolean);
      useDesignStore.getState().setSelectedIds(ids);
    };

    const handleSelectionCleared = () => {
      useDesignStore.getState().setSelectedIds([]);
    };

    const handleObjectModified = () => {
      saveHistory();
    };

    // Path created from freehand drawing
    const handlePathCreated = (e: any) => {
      const path = e.path;
      if (path) {
        (path as any).customId = generateId();
        (path as any).customName = 'Freehand';
        canvas.isDrawingMode = false;
        setActiveTool('select');
        saveHistory();
      }
    };

    // Object snapping
    const handleObjectMoving = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
      if (useDesignStore.getState().snapToGrid) {
        const gs = useDesignStore.getState().gridSize;
        const obj = e.target;
        obj.set({
          left: snapToGridValue(obj.left || 0, gs),
          top: snapToGridValue(obj.top || 0, gs),
        });
      }
    };

    canvas.on('mouse:down', handleMouseDown as any);
    canvas.on('mouse:move', handleMouseMove as any);
    canvas.on('mouse:up', handleMouseUp as any);
    canvas.on('mouse:wheel', handleWheel as any);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('path:created', handlePathCreated);
    canvas.on('object:moving', handleObjectMoving as any);

    return () => {
      canvas.off('mouse:down', handleMouseDown as any);
      canvas.off('mouse:move', handleMouseMove as any);
      canvas.off('mouse:up', handleMouseUp as any);
      canvas.off('mouse:wheel', handleWheel as any);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:moving', handleObjectMoving as any);
    };
  }, [canvasRef, addShape, saveHistory, setActiveTool, setZoom, setContextMenuPosition, showNotification, importImage]);

  // Update cursor based on tool
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = activeTool === 'select';

    const cursorMap: Record<string, string> = {
      select: 'default',
      hand: 'grab',
      rectangle: 'crosshair',
      ellipse: 'crosshair',
      line: 'crosshair',
      arrow: 'crosshair',
      triangle: 'crosshair',
      polygon: 'crosshair',
      star: 'crosshair',
      frame: 'crosshair',
      text: 'text',
      pen: 'crosshair',
      pencil: 'crosshair',
      eraser: 'crosshair',
      image: 'copy',
      eyedropper: 'crosshair',
    };

    canvas.defaultCursor = cursorMap[activeTool] || 'default';
    canvas.hoverCursor = activeTool === 'select' ? 'move' : cursorMap[activeTool] || 'default';

    if (activeTool === 'pencil') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = useDesignStore.getState().strokeColor || '#000000';
      brush.width = useDesignStore.getState().strokeWidth || 2;
      canvas.freeDrawingBrush = brush;
    }

    if (activeTool === 'eraser') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = '#f5f5f7';
      brush.width = 20;
      canvas.freeDrawingBrush = brush;
    }

    canvas.renderAll();
  }, [activeTool, canvasRef]);

  // Draw grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Remove existing grid
    const existingGrid = canvas.getObjects().filter((o) => (o as any)._isGrid);
    existingGrid.forEach((o) => canvas.remove(o));

    if (showGrid) {
      const vpt = canvas.viewportTransform!;
      const currentZoom = canvas.getZoom();
      const width = canvas.width! / currentZoom;
      const height = canvas.height! / currentZoom;
      const offsetX = -vpt[4] / currentZoom;
      const offsetY = -vpt[5] / currentZoom;

      const startX = Math.floor(offsetX / gridSize) * gridSize;
      const startY = Math.floor(offsetY / gridSize) * gridSize;
      const endX = startX + width + gridSize * 2;
      const endY = startY + height + gridSize * 2;

      for (let x = startX; x < endX; x += gridSize) {
        const line = new fabric.Line([x, startY, x, endY], {
          stroke: '#e8e8ea',
          strokeWidth: 0.5 / currentZoom,
          selectable: false,
          evented: false,
        });
        (line as any)._isGrid = true;
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }

      for (let y = startY; y < endY; y += gridSize) {
        const line = new fabric.Line([startX, y, endX, y], {
          stroke: '#e8e8ea',
          strokeWidth: 0.5 / currentZoom,
          selectable: false,
          evented: false,
        });
        (line as any)._isGrid = true;
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }
    }

    canvas.renderAll();
  }, [showGrid, gridSize, zoom, canvasRef]);

  // Drag and drop support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        Array.from(files).forEach((file) => {
          if (file.type.startsWith('image/')) {
            importImage(file);
          } else if (file.name.endsWith('.svg')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              importSVG(ev.target?.result as string);
            };
            reader.readAsText(file);
          } else if (file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              importJSON(ev.target?.result as string);
            };
            reader.readAsText(file);
          }
        });
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [importImage, importSVG, importJSON]);

  const handleZoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newZoom = Math.min(canvas.getZoom() * 1.2, 64);
    const center = new fabric.Point(canvas.width! / 2, canvas.height! / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoom(newZoom);
    canvas.renderAll();
  }, [canvasRef, setZoom]);

  const handleZoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newZoom = Math.max(canvas.getZoom() / 1.2, 0.01);
    const center = new fabric.Point(canvas.width! / 2, canvas.height! / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoom(newZoom);
    canvas.renderAll();
  }, [canvasRef, setZoom]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-canvas-bg" ref={containerRef}>
      {/* Top Bar */}
      <TopBar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomToFit={zoomToFit}
        onResetZoom={resetZoom}
        onExport={exportCanvas}
        onImportJSON={importJSON}
        onImportImage={importImage}
        onImportSVG={importSVG}
      />

      {/* Rulers */}
      <Rulers
        canvasWidth={canvasSize.w}
        canvasHeight={canvasSize.h}
        zoom={zoom}
        panX={panOffset.x}
        panY={panOffset.y}
      />

      {/* Left Panel */}
      {leftPanelOpen && (
        <div className="fixed left-0 top-12 bottom-0 w-60 bg-white/95 backdrop-blur-xl border-r border-canvas-border z-20 flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b border-canvas-border">
            {[
              { id: 'layers' as const, label: 'Layers' },
              { id: 'pages' as const, label: 'Pages' },
              { id: 'assets' as const, label: 'Assets' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLeftPanelTab(tab.id)}
                className={`flex-1 py-2 text-xs transition-colors ${
                  leftPanelTab === tab.id
                    ? 'text-canvas-accent border-b-2 border-canvas-accent font-medium'
                    : 'text-canvas-text-secondary hover:text-canvas-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {leftPanelTab === 'layers' && (
              <LayersPanel canvas={canvasRef.current} onSaveHistory={saveHistory} />
            )}
            {leftPanelTab === 'pages' && <PagesPanel />}
            {leftPanelTab === 'assets' && (
              <div className="flex items-center justify-center h-full text-xs text-canvas-text-secondary p-4 text-center">
                Drag & drop images, SVGs, or JSON files onto the canvas to import them
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Panel */}
      {rightPanelOpen && (
        <div className="fixed right-0 top-12 bottom-0 w-72 bg-white/95 backdrop-blur-xl border-l border-canvas-border z-20 flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b border-canvas-border">
            {[
              { id: 'design' as const, label: 'Design' },
              { id: 'export' as const, label: 'Export' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightPanelTab(tab.id)}
                className={`flex-1 py-2 text-xs transition-colors ${
                  rightPanelTab === tab.id
                    ? 'text-canvas-accent border-b-2 border-canvas-accent font-medium'
                    : 'text-canvas-text-secondary hover:text-canvas-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'design' && (
              <PropertiesPanel
                canvas={canvasRef.current}
                onSaveHistory={saveHistory}
                onDelete={deleteSelected}
                onDuplicate={duplicateSelected}
                onGroup={groupSelected}
                onUngroup={ungroupSelected}
                onBringForward={bringForward}
                onSendBackward={sendBackward}
                onBringToFront={bringToFront}
                onSendToBack={sendToBack}
                onFlipH={flipHorizontal}
                onFlipV={flipVertical}
                onLock={lockObject}
              />
            )}
            {rightPanelTab === 'export' && (
              <ExportPanel onExport={exportCanvas} />
            )}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        className="absolute inset-0"
        style={{
          top: 48,
          left: leftPanelOpen ? 240 : 0,
          right: rightPanelOpen ? 288 : 0,
        }}
      >
        <canvas ref={canvasElRef} />
      </div>

      {/* Bottom Toolbar */}
      <Toolbar />

      {/* Context Menu */}
      <ContextMenu
        onCopy={copyToClipboard}
        onPaste={pasteFromClipboard}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onFlipH={flipHorizontal}
        onFlipV={flipVertical}
        onLock={lockObject}
      />

      {/* Notifications */}
      <Notification />

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-white/80 backdrop-blur border-t border-canvas-border flex items-center justify-between px-4 z-10">
        <span className="text-2xs text-canvas-text-secondary">
          {useDesignStore.getState().selectedIds.length > 0
            ? `${useDesignStore.getState().selectedIds.length} selected`
            : 'Ready'}
        </span>
        <span className="text-2xs text-canvas-text-secondary font-mono">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
