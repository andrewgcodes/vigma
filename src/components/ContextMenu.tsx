'use client';

import React from 'react';
import {
  Copy,
  Clipboard,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Paintbrush,
  Group,
  Ungroup,
} from 'lucide-react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/store/useStore';
import { historyManager } from '@/utils/history';

interface ContextMenuProps {
  fabricRef: React.RefObject<fabric.Canvas | null>;
}

export default function ContextMenu({ fabricRef }: ContextMenuProps) {
  const { contextMenu, setContextMenu } = useStore();

  if (!contextMenu) return null;

  const canvas = fabricRef.current;
  if (!canvas) return null;

  const active = canvas.getActiveObject();

  const close = () => setContextMenu(null);

  const handleCopy = async () => {
    if (!active) return;
    const cloned = await active.clone();
    (window as unknown as Record<string, unknown>).__vigma_clipboard = cloned;
    close();
  };

  const handlePaste = async () => {
    const clipboard = (window as unknown as Record<string, unknown>).__vigma_clipboard as fabric.FabricObject | undefined;
    if (!clipboard) return;
    const cloned = await clipboard.clone();
    const vpt = canvas.viewportTransform;
    if (vpt) {
      const invertedTransform = fabric.util.invertTransform(vpt);
      const point = fabric.util.transformPoint(new fabric.Point(contextMenu.x, contextMenu.y), invertedTransform);
      cloned.set({ left: point.x, top: point.y });
    } else {
      cloned.set({ left: contextMenu.x, top: contextMenu.y });
    }
    const id = uuidv4();
    (cloned as fabric.FabricObject & { id?: string }).id = id;
    (cloned as fabric.FabricObject & { name?: string }).name = 'Copy';
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
    (window as unknown as Record<string, unknown>).__vigma_clipboard = cloned;
    historyManager.saveState();
    close();
  };

  const handleDelete = () => {
    const objects = canvas.getActiveObjects();
    objects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleBringForward = () => {
    if (!active) return;
    canvas.bringObjectForward(active);
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleSendBackward = () => {
    if (!active) return;
    canvas.sendObjectBackwards(active);
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleBringToFront = () => {
    if (!active) return;
    canvas.bringObjectToFront(active);
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleSendToBack = () => {
    if (!active) return;
    canvas.sendObjectToBack(active);
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleFlipH = () => {
    if (!active) return;
    active.set('flipX', !active.flipX);
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleFlipV = () => {
    if (!active) return;
    active.set('flipY', !active.flipY);
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleToggleLock = () => {
    if (!active) return;
    const isLocked = !active.selectable;
    active.selectable = isLocked;
    active.evented = isLocked;
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleToggleVisibility = () => {
    if (!active) return;
    active.visible = !active.visible;
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleCopyStyle = () => {
    if (!active) return;
    (window as unknown as Record<string, unknown>).__vigma_style = {
      fill: active.fill,
      stroke: active.stroke,
      strokeWidth: active.strokeWidth,
      opacity: active.opacity,
      shadow: active.shadow ? (active.shadow as fabric.Shadow).toObject() : null,
    };
    close();
  };

  const handlePasteStyle = () => {
    if (!active) return;
    const style = (window as unknown as Record<string, unknown>).__vigma_style as Record<string, unknown> | undefined;
    if (!style) return;
    if (style.fill !== undefined) active.set('fill', style.fill as string);
    if (style.stroke !== undefined) active.set('stroke', style.stroke as string);
    if (style.strokeWidth !== undefined) active.set('strokeWidth', style.strokeWidth as number);
    if (style.opacity !== undefined) active.set('opacity', style.opacity as number);
    if (style.shadow) {
      active.set('shadow', new fabric.Shadow(style.shadow as Partial<fabric.Shadow>));
    }
    canvas.renderAll();
    historyManager.saveState();
    close();
  };

  const handleGroup = () => {
    if (!active || active.type !== 'activeselection') return;
    const selection = active as fabric.ActiveSelection;
    const objects = selection.getObjects();
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
    close();
  };

  const handleUngroup = () => {
    if (!active || active.type !== 'group') return;
    const group = active as fabric.Group;
    const items = group.getObjects();
    const groupScaleX = group.scaleX ?? 1;
    const groupScaleY = group.scaleY ?? 1;
    const groupAngle = (group.angle ?? 0) * (Math.PI / 180);
    const center = group.getCenterPoint();
    const groupCenterX = center.x;
    const groupCenterY = center.y;
    canvas.remove(group);
    items.forEach((item) => {
      const offsetX = (item.left ?? 0) * groupScaleX;
      const offsetY = (item.top ?? 0) * groupScaleY;
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
    close();
  };

  const hasObject = !!active;
  const isMultiSelect = active?.type === 'activeselection';
  const isGroup = active?.type === 'group';
  const isLocked = active ? !active.selectable : false;

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={close} onContextMenu={(e) => { e.preventDefault(); close(); }} />
      <div
        className="fixed z-[61] bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-200/60 py-1 min-w-48"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {hasObject && (
          <>
            <MenuItem icon={<Copy size={14} />} label="Copy" shortcut="Ctrl+C" onClick={handleCopy} />
            <MenuItem icon={<Clipboard size={14} />} label="Paste" shortcut="Ctrl+V" onClick={handlePaste} />
            <MenuItem icon={<Trash2 size={14} />} label="Delete" shortcut="Del" onClick={handleDelete} />
            <Divider />
            <MenuItem icon={<ChevronsUp size={14} />} label="Bring to Front" onClick={handleBringToFront} />
            <MenuItem icon={<ArrowUp size={14} />} label="Bring Forward" onClick={handleBringForward} />
            <MenuItem icon={<ArrowDown size={14} />} label="Send Backward" onClick={handleSendBackward} />
            <MenuItem icon={<ChevronsDown size={14} />} label="Send to Back" onClick={handleSendToBack} />
            <Divider />
            <MenuItem icon={<FlipHorizontal2 size={14} />} label="Flip Horizontal" onClick={handleFlipH} />
            <MenuItem icon={<FlipVertical2 size={14} />} label="Flip Vertical" onClick={handleFlipV} />
            <Divider />
            <MenuItem icon={isLocked ? <Unlock size={14} /> : <Lock size={14} />} label={isLocked ? 'Unlock' : 'Lock'} onClick={handleToggleLock} />
            <MenuItem icon={active?.visible === false ? <Eye size={14} /> : <EyeOff size={14} />} label={active?.visible === false ? 'Show' : 'Hide'} onClick={handleToggleVisibility} />
            <Divider />
            <MenuItem icon={<Paintbrush size={14} />} label="Copy Style" onClick={handleCopyStyle} />
            <MenuItem icon={<Paintbrush size={14} />} label="Paste Style" onClick={handlePasteStyle} />
            {isMultiSelect && (
              <>
                <Divider />
                <MenuItem icon={<Group size={14} />} label="Group" shortcut="Ctrl+G" onClick={handleGroup} />
              </>
            )}
            {isGroup && (
              <>
                <Divider />
                <MenuItem icon={<Ungroup size={14} />} label="Ungroup" shortcut="Ctrl+Shift+G" onClick={handleUngroup} />
              </>
            )}
          </>
        )}
        {!hasObject && (
          <>
            <MenuItem icon={<Clipboard size={14} />} label="Paste" shortcut="Ctrl+V" onClick={handlePaste} />
          </>
        )}
      </div>
    </>
  );
}

function MenuItem({ icon, label, shortcut, onClick }: { icon: React.ReactNode; label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[10px] text-gray-400 font-mono">{shortcut}</span>}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 my-1" />;
}
