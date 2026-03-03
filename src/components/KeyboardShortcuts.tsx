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
  const { setActiveTool } = useStore();

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
          case 'e': setActiveTool('eyedropper'); break;
          case 'f': setActiveTool('frame'); break;
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
            handlePaste(canvas);
            break;
          case 'a':
            e.preventDefault();
            selectAll(canvas);
            break;
          case 'd':
            e.preventDefault();
            handleDuplicate(canvas);
            break;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) {
              ungroupObjects(canvas);
            } else {
              groupObjects(canvas);
            }
            break;
          case ']':
            e.preventDefault();
            if (e.shiftKey) {
              bringToFront(canvas);
            } else {
              bringForward(canvas);
            }
            break;
          case '[':
            e.preventDefault();
            if (e.shiftKey) {
              sendToBack(canvas);
            } else {
              sendBackward(canvas);
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
  }, [fabricRef, setActiveTool]);

  return null;
}

async function handleCopy(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active) return;
  const cloned = await active.clone();
  (window as unknown as Record<string, unknown>).__vigma_clipboard = cloned;
}

async function handlePaste(canvas: fabric.Canvas) {
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
  // Update clipboard so next paste cascades further
  (window as unknown as Record<string, unknown>).__vigma_clipboard = cloned;
  // syncLayers() already ran via the object:added event, no need for addLayer
  historyManager.saveState();
}

async function handleDuplicate(canvas: fabric.Canvas) {
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
  // syncLayers() already ran via the object:added event, no need for addLayer
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

  // Get the group's full transform
  const groupLeft = group.left ?? 0;
  const groupTop = group.top ?? 0;
  const groupScaleX = group.scaleX ?? 1;
  const groupScaleY = group.scaleY ?? 1;
  const groupAngle = (group.angle ?? 0) * (Math.PI / 180);
  const groupCenterX = groupLeft + ((group.width ?? 0) * groupScaleX) / 2;
  const groupCenterY = groupTop + ((group.height ?? 0) * groupScaleY) / 2;

  canvas.remove(group);

  items.forEach((item) => {
    // Scale child offset by group's scale
    const offsetX = (item.left ?? 0) * groupScaleX;
    const offsetY = (item.top ?? 0) * groupScaleY;

    // Rotate the scaled offset by group's angle
    const rotatedX = offsetX * Math.cos(groupAngle) - offsetY * Math.sin(groupAngle);
    const rotatedY = offsetX * Math.sin(groupAngle) + offsetY * Math.cos(groupAngle);

    item.set({
      left: groupCenterX + rotatedX,
      top: groupCenterY + rotatedY,
      scaleX: (item.scaleX ?? 1) * groupScaleX,
      scaleY: (item.scaleY ?? 1) * groupScaleY,
      angle: (item.angle ?? 0) + (group.angle ?? 0),
    });
    item.setCoords();
    canvas.add(item);
  });

  canvas.renderAll();
  historyManager.saveState();
}

function bringToFront(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active) return;
  canvas.bringObjectToFront(active);
  canvas.renderAll();
  historyManager.saveState();
}

function bringForward(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active) return;
  canvas.bringObjectForward(active);
  canvas.renderAll();
  historyManager.saveState();
}

function sendBackward(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active) return;
  canvas.sendObjectBackwards(active);
  canvas.renderAll();
  historyManager.saveState();
}

function sendToBack(canvas: fabric.Canvas) {
  const active = canvas.getActiveObject();
  if (!active) return;
  canvas.sendObjectToBack(active);
  canvas.renderAll();
  historyManager.saveState();
}
