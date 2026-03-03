'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { canvasEngine } from '@/lib/canvas-engine';
import ContextMenu from './ContextMenu';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  hasTarget: boolean;
}

export default function DesignCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const prevToolRef = useRef<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, hasTarget: false,
  });

  const {
    activeTool,
    setActiveTool,
    setSelectedObjectIds,
    setZoom,
    pushHistory,
    showGrid,
    gridSize,
    snapToGrid,
    strokeColor,
    strokeWidth,
    setObjects,
    setCursorPosition,
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
      onCursorMove: (x, y) => setCursorPosition(x, y),
      onContextMenu: (x, y, hasTarget) => {
        setContextMenu({ visible: true, x, y, hasTarget });
      },
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

  // Handle snap to grid
  useEffect(() => {
    canvasEngine.setSnapEnabled(snapToGrid);
    canvasEngine.setSnapGridSize(gridSize);
  }, [snapToGrid, gridSize]);

  // Drag-to-create shapes + canvas click handler
  useEffect(() => {
    if (!canvasEngine.canvas) return;
    const canvas = canvasEngine.canvas;

    const handleMouseDown = (opt: { e: Event; target?: unknown }) => {
      const e = opt.e as MouseEvent;
      if (e.button !== 0) return; // Only left click

      const tool = useCanvasStore.getState().activeTool;
      const state = useCanvasStore.getState();

      // Shape tools: start drag-to-create
      const dragTools = ['rectangle', 'ellipse', 'triangle', 'line', 'frame'];
      if (dragTools.includes(tool) && !opt.target) {
        isDraggingRef.current = true;
        canvasEngine.startDragCreate(tool, e, {
          fill: state.fillColor,
          stroke: state.strokeColor,
          strokeWidth: state.strokeWidth,
          opacity: state.opacity,
          rx: state.cornerRadius,
          ry: state.cornerRadius,
        });
        return;
      }

      // Non-drag tools: click to create
      if (!opt.target) {
        switch (tool) {
          case 'polygon':
            canvasEngine.addPolygon({
              fill: state.fillColor,
              stroke: state.strokeColor,
              strokeWidth: state.strokeWidth,
              opacity: state.opacity,
            });
            setActiveTool('select');
            break;
          case 'star':
            canvasEngine.addStar({
              fill: state.fillColor,
              stroke: state.strokeColor,
              strokeWidth: state.strokeWidth,
              opacity: state.opacity,
            });
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
          case 'image': {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (ev) => {
              const file = (ev.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (revt) => {
                  const dataUrl = revt.target?.result as string;
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
      }
    };

    const handleMouseMove = (opt: { e: Event }) => {
      if (isDraggingRef.current) {
        canvasEngine.updateDragCreate(opt.e as MouseEvent);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        canvasEngine.finishDragCreate();
        setActiveTool('select');
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [setActiveTool]);

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

      // Spacebar pan (hold space to temporarily use hand tool)
      if (e.key === ' ' && !ctrl && !e.repeat) {
        e.preventDefault();
        const currentTool = useCanvasStore.getState().activeTool;
        if (currentTool !== 'hand') {
          prevToolRef.current = currentTool;
          setActiveTool('hand');
        }
        return;
      }

      // Arrow key nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !ctrl) {
        e.preventDefault();
        const amount = e.shiftKey ? 10 : 1;
        switch (e.key) {
          case 'ArrowUp': canvasEngine.nudgeSelected(0, -amount); break;
          case 'ArrowDown': canvasEngine.nudgeSelected(0, amount); break;
          case 'ArrowLeft': canvasEngine.nudgeSelected(-amount, 0); break;
          case 'ArrowRight': canvasEngine.nudgeSelected(amount, 0); break;
        }
        return;
      }

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
            setContextMenu(prev => ({ ...prev, visible: false }));
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

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release spacebar -> restore previous tool
      if (e.key === ' ' && prevToolRef.current) {
        setActiveTool(prevToolRef.current as 'select' | 'hand' | 'rectangle' | 'ellipse' | 'line' | 'triangle' | 'polygon' | 'star' | 'text' | 'pen' | 'image' | 'frame');
        prevToolRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setActiveTool, setZoom]);

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas ref={canvasRef} />
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasTarget={contextMenu.hasTarget}
          onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        />
      )}
    </div>
  );
}
