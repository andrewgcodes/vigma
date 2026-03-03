'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Circle,
  Triangle,
  Type,
  Image as ImageIcon,
  Minus,
  Hexagon,
  PenLine,
  Frame,
  FolderOpen,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { canvasEngine } from '@/lib/canvas-engine';

interface LayerItem {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  children?: LayerItem[];
  depth?: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  rect: <Square size={14} />,
  circle: <Circle size={14} />,
  ellipse: <Circle size={14} />,
  triangle: <Triangle size={14} />,
  polygon: <Hexagon size={14} />,
  'i-text': <Type size={14} />,
  textbox: <Type size={14} />,
  path: <PenLine size={14} />,
  image: <ImageIcon size={14} />,
  line: <Minus size={14} />,
  frame: <Frame size={14} />,
  group: <FolderOpen size={14} />,
  star: <Star size={14} />,
};

export default function LayersPanel() {
  const { selectedObjectIds, showLayers } = useCanvasStore();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const objects = canvasEngine.getObjectsList();
      setLayers(objects);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = useCallback((layer: LayerItem) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingId && editName.trim()) {
      canvasEngine.renameObject(editingId, editName.trim());
    }
    setEditingId(null);
  }, [editingId, editName]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragId) {
      canvasEngine.moveLayerTo(dragId, targetIndex);
    }
    setDragId(null);
    setDragOverIndex(null);
  }, [dragId]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverIndex(null);
  }, []);

  const toggleGroupCollapse = useCallback((id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderLayer = (layer: LayerItem, index: number, depth: number = 0) => {
    const isGroup = layer.type === 'group';
    const isCollapsed = collapsedGroups.has(layer.id);

    return (
      <React.Fragment key={layer.id}>
        <div
          className={`layer-item ${selectedObjectIds.includes(layer.id) ? 'selected' : ''} ${dragId === layer.id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
          style={{ paddingLeft: 12 + depth * 16 }}
          onClick={() => canvasEngine.selectObjectById(layer.id)}
          onDoubleClick={() => handleDoubleClick(layer)}
          draggable
          onDragStart={(e) => handleDragStart(e, layer.id)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <span className="layer-drag-handle">
            <GripVertical size={12} />
          </span>
          {isGroup && (
            <button
              className="layer-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleGroupCollapse(layer.id);
              }}
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <span className="layer-icon">
            {typeIcons[layer.type] || <Square size={14} />}
          </span>
          {editingId === layer.id ? (
            <input
              ref={editInputRef}
              className="layer-rename-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setEditingId(null);
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="layer-name">{layer.name}</span>
          )}
          <div className="layer-actions">
            <button
              className="layer-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                canvasEngine.toggleObjectVisibility(layer.id);
              }}
              title={layer.visible ? 'Hide' : 'Show'}
            >
              {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button
              className="layer-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                canvasEngine.toggleObjectLock(layer.id);
              }}
              title={layer.locked ? 'Unlock' : 'Lock'}
            >
              {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
          </div>
        </div>
        {isGroup && !isCollapsed && layer.children && layer.children.map((child, childIdx) =>
          renderLayer(child, index + childIdx + 1, depth + 1)
        )}
      </React.Fragment>
    );
  };

  if (!showLayers) return null;

  return (
    <div className="layers-panel">
      <div className="panel-header">
        <span>Layers</span>
        <span className="layer-count">{layers.length}</span>
      </div>
      <div className="layers-list">
        {layers.length === 0 ? (
          <div className="panel-empty">
            <p>No layers yet</p>
          </div>
        ) : (
          layers.map((layer, index) => renderLayer(layer, index))
        )}
      </div>
    </div>
  );
}
