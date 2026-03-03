'use client';

import React from 'react';
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  Star,
  Hexagon,
  Type,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore, type ToolType } from '@/store/useStore';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function ToolButton({ tool, icon, label, shortcut }: ToolButtonProps) {
  const { activeTool, setActiveTool } = useStore();
  const isActive = activeTool === tool;

  return (
    <button
      onClick={() => setActiveTool(tool)}
      className={`relative group flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
        isActive
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      {icon}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
        <span className="font-medium">{label}</span>
        {shortcut && <span className="ml-1.5 text-gray-400">{shortcut}</span>}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      </div>
    </button>
  );
}

export default function Toolbar() {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 p-1.5 flex flex-col gap-0.5">
        <ToolButton tool="select" icon={<MousePointer2 size={18} />} label="Select" shortcut="V" />
        <ToolButton tool="hand" icon={<Hand size={18} />} label="Hand" shortcut="H" />

        <div className="w-full h-px bg-gray-100 my-1" />

        <ToolButton tool="rectangle" icon={<Square size={18} />} label="Rectangle" shortcut="R" />
        <ToolButton tool="ellipse" icon={<Circle size={18} />} label="Ellipse" shortcut="O" />
        <ToolButton tool="triangle" icon={<Triangle size={18} />} label="Triangle" />
        <ToolButton tool="line" icon={<Minus size={18} />} label="Line" shortcut="L" />
        <ToolButton tool="arrow" icon={<ArrowRight size={18} />} label="Arrow" />
        <ToolButton tool="star" icon={<Star size={18} />} label="Star" />
        <ToolButton tool="polygon" icon={<Hexagon size={18} />} label="Polygon" />

        <div className="w-full h-px bg-gray-100 my-1" />

        <ToolButton tool="text" icon={<Type size={18} />} label="Text" shortcut="T" />
        <ToolButton tool="pen" icon={<Pencil size={18} />} label="Pen" shortcut="P" />
        <ToolButton tool="image" icon={<ImageIcon size={18} />} label="Image" />
      </div>
    </div>
  );
}
