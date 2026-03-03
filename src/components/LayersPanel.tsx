'use client';

import React from 'react';
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
  Pencil,
  Star,
  Hexagon,
  Minus,
  ChevronRight,
  Layers,
} from 'lucide-react';
import * as fabric from 'fabric';
import { useStore } from '@/store/useStore';

interface LayersPanelProps {
  fabricRef: React.RefObject<fabric.Canvas | null>;
}

function getLayerIcon(type: string) {
  const iconProps = { size: 14, className: 'text-gray-400' };
  switch (type) {
    case 'rect': return <Square {...iconProps} />;
    case 'circle':
    case 'ellipse': return <Circle {...iconProps} />;
    case 'triangle': return <Triangle {...iconProps} />;
    case 'textbox':
    case 'i-text':
    case 'text': return <Type {...iconProps} />;
    case 'image': return <ImageIcon {...iconProps} />;
    case 'path': return <Pencil {...iconProps} />;
    case 'polygon': return <Hexagon {...iconProps} />;
    case 'line': return <Minus {...iconProps} />;
    default: return <Star {...iconProps} />;
  }
}

export default function LayersPanel({ fabricRef }: LayersPanelProps) {
  const {
    layers,
    selectedObjectIds,
    updateLayer,
  } = useStore();

  const [collapsed, setCollapsed] = React.useState(false);

  const handleSelect = (id: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };

  const handleToggleVisibility = (id: string, visible: boolean) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (obj) {
      obj.visible = !visible;
      updateLayer(id, { visible: !visible });
      canvas.renderAll();
    }
  };

  const handleToggleLock = (id: string, locked: boolean) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (obj) {
      obj.selectable = locked;
      obj.evented = locked;
      updateLayer(id, { locked: !locked });
      canvas.renderAll();
    }
  };

  if (collapsed) {
    return (
      <div className="fixed left-16 bottom-4 z-40">
        <button
          onClick={() => setCollapsed(false)}
          className="bg-white rounded-xl shadow-lg shadow-black/5 border border-gray-200/60 p-2.5 text-gray-500 hover:text-gray-700 transition-colors"
          title="Show Layers"
        >
          <Layers size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed left-16 bottom-4 z-40 w-60">
      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Layers</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight size={14} className="rotate-90" />
          </button>
        </div>

        {/* Layer List */}
        <div className="max-h-64 overflow-y-auto">
          {layers.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-gray-400">No layers yet</p>
              <p className="text-[10px] text-gray-300 mt-1">Draw something to get started</p>
            </div>
          ) : (
            layers.map((layer) => {
              const isSelected = selectedObjectIds.includes(layer.id);
              return (
                <div
                  key={layer.id}
                  onClick={() => handleSelect(layer.id)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
                    isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {getLayerIcon(layer.type)}
                  <span className={`flex-1 text-xs truncate ${
                    isSelected ? 'text-indigo-700 font-medium' : 'text-gray-600'
                  } ${!layer.visible ? 'opacity-40' : ''}`}>
                    {layer.name}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id, layer.visible); }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    >
                      {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleLock(layer.id, layer.locked); }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    >
                      {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
