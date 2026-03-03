'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { canvasEngine } from '@/lib/canvas-engine';

export default function DesignCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    activeTool,
    setActiveTool,
    setSelectedObjectIds,
    setZoom,
    pushHistory,
    showGrid,
    gridSize,
    strokeColor,
    strokeWidth,
    setObjects,
  } = useCanvasStore();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    canvasEngine.init(canvasRef.current, {
      onSelectionChange: (ids) => setSelectedObjectIds(ids),
      onObjectsChange: () => {
        const objects = canvasEngine.getObjectsList();
        setObjects(objects);
      },
      onZoomChange: (z) => setZoom(z),
      onHistoryPush: (json) => pushHistory({ json, timestamp: Date.now() }),
    });

    // Enable middle-click panning
    canvasEngine.enablePanning();

    const handleResize = () => {
      if (containerRef.current) {
        canvasEngine.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvasEngine.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle tool changes
  useEffect(() => {
    // Disable all modes first
    canvasEngine.disableDrawing();
    canvasEngine.disableHandTool();

    if (!canvasEngine.canvas) return;

    switch (activeTool) {
      case 'hand':
        canvasEngine.enableHandTool();
        break;
      case 'pen':
        canvasEngine.enableDrawing({ color: strokeColor || '#000000', width: strokeWidth || 2 });
        break;
      case 'select':
        canvasEngine.canvas.defaultCursor = 'default';
        canvasEngine.canvas.selection = true;
        break;
      default:
        canvasEngine.canvas.defaultCursor = 'crosshair';
        canvasEngine.canvas.selection = false;
        break;
    }
  }, [activeTool, strokeColor, strokeWidth]);

  // Handle grid
  useEffect(() => {
    canvasEngine.drawGrid(gridSize, showGrid);
  }, [showGrid, gridSize]);

  // Handle shape creation on canvas click
  const handleCanvasClick = useCallback(() => {
    const tool = useCanvasStore.getState().activeTool;
    const state = useCanvasStore.getState();
    const shapeOptions = {
      fill: state.fillColor,
      stroke: state.strokeColor,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
    };

    switch (tool) {
      case 'rectangle':
        canvasEngine.addRectangle({
          ...shapeOptions,
          rx: state.cornerRadius,
          ry: state.cornerRadius,
        });
        setActiveTool('select');
        break;
      case 'ellipse':
        canvasEngine.addEllipse(shapeOptions);
        setActiveTool('select');
        break;
      case 'triangle':
        canvasEngine.addTriangle(shapeOptions);
        setActiveTool('select');
        break;
      case 'line':
        canvasEngine.addLine({
          stroke: state.strokeColor || '#000000',
          strokeWidth: state.strokeWidth || 2,
          opacity: state.opacity,
        });
        setActiveTool('select');
        break;
      case 'polygon':
        canvasEngine.addPolygon(shapeOptions);
        setActiveTool('select');
        break;
      case 'star':
        canvasEngine.addStar(shapeOptions);
        setActiveTool('select');
        break;
      case 'text':
        canvasEngine.addText({
          fill: state.fillColor,
          fontSize: state.fontSize,
          fontFamily: state.fontFamily,
          fontWeight: state.fontWeight,
          fontStyle: state.fontStyle,
          textAlign: state.textAlign,
          opacity: state.opacity,
        });
        setActiveTool('select');
        break;
      case 'frame':
        canvasEngine.addFrame({});
        setActiveTool('select');
        break;
      case 'image': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              canvasEngine.addImage(dataUrl);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        setActiveTool('select');
        break;
      }
    }
  }, [setActiveTool]);

  // Canvas click handler for shape tools
  useEffect(() => {
    if (!canvasEngine.canvas) return;
    const canvas = canvasEngine.canvas;

    const handler = (opt: { e: Event; target?: unknown }) => {
      // Only create shape if clicking on empty canvas (no target)
      if (!opt.target) {
        handleCanvasClick();
      }
    };

    canvas.on('mouse:down', handler);
    return () => {
      canvas.off('mouse:down', handler);
    };
  }, [handleCanvasClick]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Check if text is being edited
      if (canvasEngine.canvas) {
        const activeObj = canvasEngine.canvas.getActiveObject();
        if (activeObj && 'isEditing' in activeObj && activeObj.isEditing) {
          return;
        }
      }

      const ctrl = e.metaKey || e.ctrlKey;

      // Tool shortcuts
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            break;
          case 'h':
            setActiveTool('hand');
            break;
          case 'r':
            setActiveTool('rectangle');
            break;
          case 'o':
            setActiveTool('ellipse');
            break;
          case 'l':
            setActiveTool('line');
            break;
          case 'p':
            setActiveTool('pen');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 'f':
            setActiveTool('frame');
            break;
          case 'delete':
          case 'backspace':
            canvasEngine.deleteSelected();
            break;
          case 'escape':
            canvasEngine.deselectAll();
            setActiveTool('select');
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              const store = useCanvasStore.getState();
              store.redo();
              const entry = store.history[store.historyIndex + 1];
              if (entry) canvasEngine.restoreFromHistory(entry.json);
            } else {
              const store = useCanvasStore.getState();
              store.undo();
              const entry = store.history[store.historyIndex - 1];
              if (entry) canvasEngine.restoreFromHistory(entry.json);
            }
            break;
          case 'c':
            e.preventDefault();
            canvasEngine.copyToClipboard();
            break;
          case 'v':
            e.preventDefault();
            canvasEngine.pasteFromClipboard();
            break;
          case 'd':
            e.preventDefault();
            canvasEngine.duplicateSelected();
            break;
          case 'a':
            e.preventDefault();
            canvasEngine.selectAll();
            break;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) {
              canvasEngine.ungroupSelected();
            } else {
              canvasEngine.groupSelected();
            }
            break;
          case '=':
          case '+':
            e.preventDefault();
            canvasEngine.zoomIn();
            break;
          case '-':
            e.preventDefault();
            canvasEngine.zoomOut();
            break;
          case '0':
            e.preventDefault();
            canvasEngine.zoomToFit();
            setZoom(1);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, setZoom]);

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
