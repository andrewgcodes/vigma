'use client';

import React, { useRef } from 'react';
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
  Pipette,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { canvasEngine } from '@/lib/canvas-engine';
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
];

export default function Toolbar() {
  const { activeTool, setActiveTool } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        canvasEngine.addImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

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
        {/* Image button - directly opens file picker */}
        <button
          className="toolbar-btn"
          onClick={handleImageClick}
          title="Image (Upload)"
        >
          <ImagePlus size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <div className="toolbar-separator" />

        {/* Eyedropper tool */}
        <button
          className={`toolbar-btn ${activeTool === 'eyedropper' ? 'active' : ''}`}
          onClick={() => setActiveTool('eyedropper')}
          title="Eyedropper (I)"
        >
          <Pipette size={18} />
        </button>
      </div>
    </div>
  );
}
