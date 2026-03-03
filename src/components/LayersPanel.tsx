'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { canvasEngine } from '@/lib/canvas-engine';

interface LayerItem {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
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
};

export default function LayersPanel() {
  const { selectedObjectIds, showLayers } = useCanvasStore();
  const [layers, setLayers] = useState<LayerItem[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const objects = canvasEngine.getObjectsList();
      setLayers(objects);
    }, 200);
    return () => clearInterval(interval);
  }, []);

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
          layers.map((layer) => (
            <div
              key={layer.id}
              className={`layer-item ${selectedObjectIds.includes(layer.id) ? 'selected' : ''}`}
              onClick={() => canvasEngine.selectObjectById(layer.id)}
            >
              <span className="layer-icon">
                {typeIcons[layer.type] || <Square size={14} />}
              </span>
              <span className="layer-name">{layer.name}</span>
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
          ))
        )}
      </div>
    </div>
  );
}
