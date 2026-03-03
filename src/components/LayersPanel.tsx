'use client';

import React, { useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useDesignStore } from '@/store/useDesignStore';
import {
  Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown,
  Layers, Plus, Trash2, Copy, Group, Ungroup,
  ArrowUp, ArrowDown, GripVertical,
} from 'lucide-react';

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
  onSaveHistory: () => void;
}

interface LayerItemData {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  object: fabric.FabricObject;
  children: LayerItemData[];
  expanded: boolean;
  depth: number;
  isGroup: boolean;
  isFrame: boolean;
  isActive: boolean;
}

function getLayerIcon(type: string): string {
  switch (type) {
    case 'rect': return '▭';
    case 'circle':
    case 'ellipse': return '○';
    case 'triangle': return '△';
    case 'line': return '—';
    case 'i-text':
    case 'text':
    case 'textbox': return 'T';
    case 'image': return '🖼';
    case 'path': return '⌇';
    case 'polygon': return '⬡';
    case 'group': return '⊞';
    default: return '◇';
  }
}

function LayerRow({
  item,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onDelete,
  onToggleExpand,
}: {
  item: LayerItemData;
  onSelect: (id: string, multi: boolean) => void;
  onToggleVisibility: (obj: fabric.FabricObject) => void;
  onToggleLock: (obj: fabric.FabricObject) => void;
  onRename: (obj: fabric.FabricObject, name: string) => void;
  onDelete: (obj: fabric.FabricObject) => void;
  onToggleExpand: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [isHovered, setIsHovered] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(item.name);
  };

  const handleRenameSubmit = () => {
    setIsEditing(false);
    onRename(item.object, editName);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors group ${
          item.isActive
            ? 'bg-canvas-accent/10 text-canvas-accent'
            : 'hover:bg-canvas-hover text-canvas-text'
        }`}
        style={{ paddingLeft: `${8 + item.depth * 16}px` }}
        onClick={(e) => onSelect(item.id, e.shiftKey || e.metaKey || e.ctrlKey)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      >
        {item.isGroup || item.isFrame ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(item.id); }}
            className="p-0.5 hover:bg-canvas-active rounded"
          >
            {item.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className="text-xs w-4 text-center opacity-60">
          {getLayerIcon(item.type)}
        </span>

        {isEditing ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
            className="flex-1 text-xs bg-white border border-canvas-accent rounded px-1 py-0.5 outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 text-xs truncate ${!item.visible ? 'opacity-40' : ''}`}>
            {item.name}
          </span>
        )}

        <div className={`flex items-center gap-0.5 ${isHovered || !item.visible || item.locked ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.object); }}
            className="p-0.5 hover:bg-canvas-active rounded text-canvas-text-secondary"
          >
            {item.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(item.object); }}
            className="p-0.5 hover:bg-canvas-active rounded text-canvas-text-secondary"
          >
            {item.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
        </div>
      </div>

      {item.expanded && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <LayerRow
              key={child.id}
              item={child}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              onRename={onRename}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LayersPanel({ canvas, onSaveHistory }: LayersPanelProps) {
  const selectedIds = useDesignStore((s) => s.selectedIds);
  const setSelectedIds = useDesignStore((s) => s.setSelectedIds);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const getLayerItems = useCallback((): LayerItemData[] => {
    if (!canvas) return [];
    const objects = canvas.getObjects();
    const activeObjects = canvas.getActiveObjects();
    const activeIds = new Set(activeObjects.map((o) => (o as any).customId));

    const buildItem = (obj: fabric.FabricObject, depth: number): LayerItemData => {
      const id = (obj as any).customId || `temp-${Math.random()}`;
      const isGroup = obj.type === 'group';
      const isFrame = (obj as any).isFrame === true;
      const children: LayerItemData[] = [];

      if (isGroup && expandedGroups.has(id)) {
        const groupObjects = (obj as fabric.Group).getObjects();
        groupObjects.forEach((child) => {
          children.push(buildItem(child, depth + 1));
        });
      }

      return {
        id,
        name: (obj as any).customName || obj.type || 'Object',
        type: obj.type || 'unknown',
        visible: obj.visible !== false,
        locked: obj.lockMovementX === true,
        object: obj,
        children,
        expanded: expandedGroups.has(id),
        depth,
        isGroup,
        isFrame,
        isActive: activeIds.has(id),
      };
    };

    return objects.map((obj) => buildItem(obj, 0)).reverse();
  }, [canvas, expandedGroups]);

  const handleSelect = useCallback((id: string, multi: boolean) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const obj = objects.find((o) => (o as any).customId === id);
    if (!obj) return;

    if (multi) {
      const current = canvas.getActiveObjects();
      if (current.includes(obj)) {
        // Deselect
        const filtered = current.filter((o) => o !== obj);
        if (filtered.length === 0) {
          canvas.discardActiveObject();
        } else if (filtered.length === 1) {
          canvas.setActiveObject(filtered[0]);
        } else {
          const sel = new fabric.ActiveSelection(filtered, { canvas });
          canvas.setActiveObject(sel);
        }
      } else {
        const all = [...current, obj];
        if (all.length === 1) {
          canvas.setActiveObject(all[0]);
        } else {
          const sel = new fabric.ActiveSelection(all, { canvas });
          canvas.setActiveObject(sel);
        }
      }
    } else {
      canvas.setActiveObject(obj);
    }
    canvas.renderAll();
    refresh();
  }, [canvas, refresh]);

  const handleToggleVisibility = useCallback((obj: fabric.FabricObject) => {
    obj.set('visible', !obj.visible);
    canvas?.renderAll();
    refresh();
  }, [canvas, refresh]);

  const handleToggleLock = useCallback((obj: fabric.FabricObject) => {
    const isLocked = obj.lockMovementX;
    obj.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockRotation: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      hasControls: isLocked,
      selectable: isLocked,
    });
    canvas?.renderAll();
    refresh();
  }, [canvas, refresh]);

  const handleRename = useCallback((obj: fabric.FabricObject, name: string) => {
    (obj as any).customName = name;
    refresh();
    onSaveHistory();
  }, [refresh, onSaveHistory]);

  const handleDelete = useCallback((obj: fabric.FabricObject) => {
    canvas?.remove(obj);
    canvas?.renderAll();
    onSaveHistory();
    refresh();
  }, [canvas, onSaveHistory, refresh]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const items = getLayerItems();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
        <div className="flex items-center gap-1.5">
          <Layers size={14} className="text-canvas-text-secondary" />
          <span className="text-xs font-medium text-canvas-text">Layers</span>
        </div>
        <span className="text-2xs text-canvas-text-secondary">{items.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-canvas-text-secondary">
            No layers yet
          </div>
        ) : (
          items.map((item) => (
            <LayerRow
              key={item.id}
              item={item}
              onSelect={handleSelect}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onRename={handleRename}
              onDelete={handleDelete}
              onToggleExpand={handleToggleExpand}
            />
          ))
        )}
      </div>
    </div>
  );
}
