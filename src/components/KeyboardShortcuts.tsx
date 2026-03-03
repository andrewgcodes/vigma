'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/store/useStore';
import { historyManager } from '@/utils/history';

interface KeyboardShortcutsProps {
  fabricRef: React.RefObject<fabric.Canvas | null>;
}

export default function KeyboardShortcuts({ fabricRef }: KeyboardShortcutsProps) {
  const { setActiveTool, addLayer } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      // Check if we're editing text on canvas
      const activeObj = canvas.getActiveObject();
      if (activeObj && (activeObj as fabric.Textbox).isEditing) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Tool shortcuts
      if (!isCtrlOrCmd && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('select'); break;
          case 'h': setActiveTool('hand'); break;
          case 'r': setActiveTool('rectangle'); break;
          case 'o': setActiveTool('ellipse'); break;
          case 'l': setActiveTool('line'); break;
          case 't': setActiveTool('text'); break;
          case 'p': setActiveTool('pen'); break;
          case 'escape':
            canvas.discardActiveObject();
            canvas.renderAll();
            setActiveTool('select');
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              historyManager.redo();
            } else {
              historyManager.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            historyManager.redo();
            break;
          case 'c':
            e.preventDefault();
            handleCopy(canvas);
            break;
          case 'v':
            e.preventDefault();
            handlePaste(canvas, addLayer);
            break;
          case 'a':
            e.preventDefault();
            selectAll(canvas);
            break;
          case 'd':
            e.preventDefault();
            handleDuplicate(canvas, addLayer);
            break;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) {
              ungroupObjects(canvas);
            } else {
              groupObjects(canvas);
            }
            break;
        }
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          const active = canvas.getActiveObjects();
          if (active.length > 0) {
            active.forEach((obj) => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.renderAll();
            historyManager.saveState();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricRef, setActiveTool, addLayer]);

  return null;
}

async function handleCopy(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active) return;
  const cloned = await active.clone();
  (window as unknown as Record<string, unknown>).__vigma_clipboard = cloned;
}

async function handlePaste(canvas: fabric.Canvas, addLayer: (layer: { id: string; name: string; type: string; visible: boolean; locked: boolean }) => void) {
  const clipboard = (window as unknown as Record<string, unknown>).__vigma_clipboard as fabric.FabricObject | undefined;
  if (!clipboard) return;
  const cloned = await clipboard.clone();
  cloned.set({
    left: (cloned.left ?? 0) + 20,
    top: (cloned.top ?? 0) + 20,
  });
  const id = uuidv4();
  (cloned as fabric.FabricObject & { id?: string }).id = id;
  (cloned as fabric.FabricObject & { name?: string }).name = 'Copy';
  canvas.add(cloned);
  canvas.setActiveObject(cloned);
  canvas.renderAll();
  addLayer({ id, name: 'Copy', type: cloned.type || 'object', visible: true, locked: false });
  historyManager.saveState();
}

async function handleDuplicate(canvas: fabric.Canvas, addLayer: (layer: { id: string; name: string; type: string; visible: boolean; locked: boolean }) => void) {
  const active = canvas.getActiveObject();
  if (!active) return;
  const cloned = await active.clone();
  cloned.set({
    left: (cloned.left ?? 0) + 20,
    top: (cloned.top ?? 0) + 20,
  });
  const id = uuidv4();
  (cloned as fabric.FabricObject & { id?: string }).id = id;
  (cloned as fabric.FabricObject & { name?: string }).name = 'Copy';
  canvas.add(cloned);
  canvas.setActiveObject(cloned);
  canvas.renderAll();
  addLayer({ id, name: 'Copy', type: cloned.type || 'object', visible: true, locked: false });
  historyManager.saveState();
}

function selectAll(canvas: fabric.Canvas) {
  const objects = canvas.getObjects().filter(
    (obj) => obj.selectable !== false && !(obj as fabric.FabricObject & { isGrid?: boolean }).isGrid
  );
  if (objects.length === 0) return;
  const selection = new fabric.ActiveSelection(objects, { canvas });
  canvas.setActiveObject(selection);
  canvas.renderAll();
}

function groupObjects(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active || active.type !== 'activeselection') return;

  const selection = active as fabric.ActiveSelection;
  const objects = selection.getObjects();

  // Remove from canvas individually
  objects.forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();

  const group = new fabric.Group(objects);
  const id = uuidv4();
  (group as fabric.FabricObject & { id?: string }).id = id;
  (group as fabric.FabricObject & { name?: string }).name = 'Group';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();
  historyManager.saveState();
}

function ungroupObjects(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active || active.type !== 'group') return;

  const group = active as fabric.Group;
  const items = group.getObjects();

  // Get the group's transform
  const groupLeft = group.left ?? 0;
  const groupTop = group.top ?? 0;

  canvas.remove(group);

  items.forEach((item) => {
    item.set({
      left: (item.left ?? 0) + groupLeft + (group.width ?? 0) / 2,
      top: (item.top ?? 0) + groupTop + (group.height ?? 0) / 2,
    });
    item.setCoords();
    canvas.add(item);
  });

  canvas.renderAll();
  historyManager.saveState();
}
