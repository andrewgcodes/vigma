'use client';

import React, { useState, useRef } from 'react';
import { useDesignStore } from '@/store/useDesignStore';
import {
  MousePointer2, Hand, Square, Circle, Type, Pen, Pencil,
  Minus, ArrowRight, Triangle, Star, Hexagon, Frame,
  Image, Pipette, Eraser, ChevronDown,
} from 'lucide-react';
import type { ToolType } from '@/types/design';

const toolGroups: { tools: { id: ToolType; icon: React.ReactNode; label: string }[]; expandable?: boolean }[] = [
  {
    tools: [
      { id: 'select', icon: <MousePointer2 size={18} />, label: 'Move (V)' },
    ],
  },
  {
    tools: [
      { id: 'hand', icon: <Hand size={18} />, label: 'Hand (H)' },
    ],
  },
  {
    tools: [
      { id: 'frame', icon: <Frame size={18} />, label: 'Frame (F)' },
    ],
  },
  {
    expandable: true,
    tools: [
      { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle (R)' },
      { id: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse (O)' },
      { id: 'triangle', icon: <Triangle size={18} />, label: 'Triangle' },
      { id: 'polygon', icon: <Hexagon size={18} />, label: 'Polygon' },
      { id: 'star', icon: <Star size={18} />, label: 'Star' },
      { id: 'line', icon: <Minus size={18} />, label: 'Line (L)' },
      { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow (A)' },
    ],
  },
  {
    expandable: true,
    tools: [
      { id: 'pen', icon: <Pen size={18} />, label: 'Pen (P)' },
      { id: 'pencil', icon: <Pencil size={18} />, label: 'Pencil (B)' },
      { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser (E)' },
    ],
  },
  {
    tools: [
      { id: 'text', icon: <Type size={18} />, label: 'Text (T)' },
    ],
  },
  {
    tools: [
      { id: 'image', icon: <Image size={18} />, label: 'Image' },
    ],
  },
  {
    tools: [
      { id: 'eyedropper', icon: <Pipette size={18} />, label: 'Eyedropper (I)' },
    ],
  },
];

export default function Toolbar() {
  const activeTool = useDesignStore((s) => s.activeTool);
  const setActiveTool = useDesignStore((s) => s.setActiveTool);
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const [selectedInGroup, setSelectedInGroup] = useState<Record<number, number>>({});

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);
    setOpenGroup(null);
  };

  const handleGroupClick = (groupIndex: number) => {
    if (openGroup === groupIndex) {
      setOpenGroup(null);
    } else {
      setOpenGroup(groupIndex);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-toolbar px-2 py-1.5 border border-white/20">
        {toolGroups.map((group, gi) => {
          const selectedIdx = selectedInGroup[gi] || 0;
          const primaryTool = group.tools[selectedIdx] || group.tools[0];
          const isActive = group.tools.some((t) => t.id === activeTool);

          return (
            <div key={gi} className="relative">
              <div className="flex items-center">
                <button
                  onClick={() => handleToolClick(primaryTool.id)}
                  className={`p-2 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-canvas-accent text-white shadow-sm'
                      : 'text-canvas-text-secondary hover:bg-canvas-hover hover:text-canvas-text'
                  }`}
                  title={primaryTool.label}
                >
                  {primaryTool.icon}
                </button>
                {group.expandable && (
                  <button
                    onClick={() => handleGroupClick(gi)}
                    className={`-ml-1 p-0.5 rounded transition-colors ${
                      isActive ? 'text-white/70' : 'text-canvas-text-secondary/50 hover:text-canvas-text-secondary'
                    }`}
                  >
                    <ChevronDown size={10} />
                  </button>
                )}
              </div>

              {group.expandable && openGroup === gi && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenGroup(null)} />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-dropdown border border-canvas-border p-1 z-50 min-w-max">
                    {group.tools.map((tool, ti) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          handleToolClick(tool.id);
                          setSelectedInGroup({ ...selectedInGroup, [gi]: ti });
                        }}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTool === tool.id
                            ? 'bg-canvas-accent/10 text-canvas-accent'
                            : 'text-canvas-text hover:bg-canvas-hover'
                        }`}
                      >
                        {tool.icon}
                        <span className="text-xs whitespace-nowrap">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {gi < toolGroups.length - 1 && gi % 2 === 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-canvas-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
