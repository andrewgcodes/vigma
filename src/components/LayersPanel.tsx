'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Square,
  Circle,
  Triangle,
  Type,
  ImageIcon,
  Minus,
  Star,
  Hexagon,
  Pencil,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { getObjectId } from '@/lib/canvas-utils';
import type { Canvas, FabricObject } from 'fabric';

interface LayersPanelProps {
  canvas: React.RefObject<Canvas | null>;
}

function getLayerIcon(type: string) {
  switch (type) {
    case 'rect':
      return <Square size={14} />;
    case 'circle':
      return <Circle size={14} />;
    case 'ellipse':
      return <Circle size={14} className="scale-x-125" />;
    case 'triangle':
      return <Triangle size={14} />;
    case 'textbox':
    case 'i-text':
    case 'text':
      return <Type size={14} />;
    case 'image':
      return <ImageIcon size={14} />;
    case 'line':
      return <Minus size={14} />;
    case 'polygon':
      return <Hexagon size={14} />;
    case 'path':
      return <Pencil size={14} />;
    default:
      return <Star size={14} />;
  }
}

export default function LayersPanel({ canvas }: LayersPanelProps) {
  const { layers, selectedObjectIds, setSelectedObjectIds, updateLayer, setLayers } =
    useEditorStore();
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const findObjectById = (id: string): FabricObject | undefined => {
    if (!canvas.current) return undefined;
    return canvas.current.getObjects().find((obj) => getObjectId(obj) === id);
  };

  const handleSelect = (id: string) => {
    const obj = findObjectById(id);
    if (!obj || !canvas.current) return;
    canvas.current.setActiveObject(obj);
    canvas.current.renderAll();
    setSelectedObjectIds([id]);
  };

  const handleToggleVisibility = (id: string, visible: boolean) => {
    const obj = findObjectById(id);
    if (!obj || !canvas.current) return;
    obj.visible = !visible;
    updateLayer(id, { visible: !visible });
    canvas.current.renderAll();
  };

  const handleToggleLock = (id: string, locked: boolean) => {
    const obj = findObjectById(id);
    if (!obj || !canvas.current) return;
    obj.selectable = locked;
    obj.evented = locked;
    updateLayer(id, { locked: !locked });
    canvas.current.renderAll();
  };

  const handleDelete = (id: string) => {
    const obj = findObjectById(id);
    if (!obj || !canvas.current) return;
    canvas.current.remove(obj);
    canvas.current.renderAll();
    // Explicitly save history since object:removed no longer does it
    const json = JSON.stringify(canvas.current.toObject(['customId', 'customName']));
    useEditorStore.getState().pushHistory(json);
  };

  const handleMoveUp = (index: number) => {
    if (!canvas.current || index <= 0) return;
    const layerToMove = layers[index];
    const obj = findObjectById(layerToMove.id);
    if (!obj) return;

    const canvasObjects = canvas.current.getObjects();
    const objIndex = canvasObjects.indexOf(obj);
    if (objIndex < canvasObjects.length - 1) {
      canvas.current.moveObjectTo(obj, objIndex + 1);
      canvas.current.renderAll();

      const newLayers = [...layers];
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      setLayers(newLayers);
    }
  };

  const handleMoveDown = (index: number) => {
    if (!canvas.current || index >= layers.length - 1) return;
    const layerToMove = layers[index];
    const obj = findObjectById(layerToMove.id);
    if (!obj) return;

    const canvasObjects = canvas.current.getObjects();
    const objIndex = canvasObjects.indexOf(obj);
    if (objIndex > 0) {
      canvas.current.moveObjectTo(obj, objIndex - 1);
      canvas.current.renderAll();

      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      setLayers(newLayers);
    }
  };

  const handleRename = (id: string) => {
    updateLayer(id, { name: editName });
    const obj = findObjectById(id);
    if (obj) {
      (obj as FabricObject & { customName?: string }).customName = editName;
    }
    setEditingId(null);
  };

  if (collapsed) {
    return (
      <div className="w-10 bg-panel-bg border-r border-panel-border flex flex-col items-center pt-3">
        <button
          onClick={() => setCollapsed(false)}
          className="tool-btn"
          title="Show Layers"
        >
          <PanelLeft size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 bg-panel-bg border-r border-panel-border flex flex-col select-none">
      <div className="flex items-center justify-between px-3 py-2 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Layers
          </span>
        </div>
        <button onClick={() => setCollapsed(true)} className="tool-btn w-6 h-6">
          <PanelLeftClose size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-text-muted text-xs">
            <Layers size={24} className="mb-2 opacity-30" />
            No layers yet
          </div>
        ) : (
          layers.map((layer, index) => (
            <div
              key={layer.id}
              onClick={() => handleSelect(layer.id)}
              className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer border-b border-panel-border/50 group ${
                selectedObjectIds.includes(layer.id)
                  ? 'bg-accent/20 border-l-2 border-l-accent'
                  : 'hover:bg-toolbar-hover/50'
              }`}
            >
              <span className="text-text-muted flex-shrink-0">{getLayerIcon(layer.type)}</span>

              {editingId === layer.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(layer.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(layer.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="panel-input text-xs py-0.5 flex-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`text-xs flex-1 truncate ${
                    !layer.visible ? 'text-text-muted line-through' : 'text-text-primary'
                  }`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(layer.id);
                    setEditName(layer.name);
                  }}
                >
                  {layer.name}
                </span>
              )}

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveUp(index);
                  }}
                  className="tool-btn w-5 h-5"
                  title="Move Up"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveDown(index);
                  }}
                  className="tool-btn w-5 h-5"
                  title="Move Down"
                >
                  <ChevronDown size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(layer.id, layer.visible);
                  }}
                  className="tool-btn w-5 h-5"
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLock(layer.id, layer.locked);
                  }}
                  className="tool-btn w-5 h-5"
                  title={layer.locked ? 'Unlock' : 'Lock'}
                >
                  {layer.locked ? <Lock size={10} /> : <Unlock size={10} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(layer.id);
                  }}
                  className="tool-btn w-5 h-5 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
