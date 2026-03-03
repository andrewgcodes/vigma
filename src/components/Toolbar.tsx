'use client';

import React from 'react';
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Triangle,
  Minus,
  Hexagon,
  Star,
  Type,
  Pen,
  ImagePlus,
  Frame,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import type { ToolType } from '@/types';

interface ToolItem {
  id: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const tools: ToolItem[] = [
  { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select', shortcut: 'V' },
  { id: 'hand', icon: <Hand size={18} />, label: 'Hand', shortcut: 'H' },
  { id: 'frame', icon: <Frame size={18} />, label: 'Frame', shortcut: 'F' },
  { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse', shortcut: 'O' },
  { id: 'triangle', icon: <Triangle size={18} />, label: 'Triangle' },
  { id: 'line', icon: <Minus size={18} />, label: 'Line', shortcut: 'L' },
  { id: 'polygon', icon: <Hexagon size={18} />, label: 'Polygon' },
  { id: 'star', icon: <Star size={18} />, label: 'Star' },
  { id: 'text', icon: <Type size={18} />, label: 'Text', shortcut: 'T' },
  { id: 'pen', icon: <Pen size={18} />, label: 'Pen', shortcut: 'P' },
  { id: 'image', icon: <ImagePlus size={18} />, label: 'Image' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
