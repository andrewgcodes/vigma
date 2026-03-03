'use client';

import React, { useRef } from 'react';
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
  Pipette,
  Frame,
} from 'lucide-react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useStore, type ToolType } from '@/store/useStore';
import { historyManager } from '@/utils/history';

interface ToolbarProps {
  fabricRef: React.RefObject<fabric.Canvas | null>;
}

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}

function ToolButton({ tool, icon, label, shortcut, onClick }: ToolButtonProps) {
  const { activeTool, setActiveTool } = useStore();
  const isActive = activeTool === tool;

  return (
    <button
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          setActiveTool(tool);
        }
      }}
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

export default function Toolbar({ fabricRef }: ToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = fabricRef.current;
    if (!canvas || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgEl = document.createElement('img');
      imgEl.onload = () => {
        const img = new fabric.FabricImage(imgEl, {
          left: 100,
          top: 100,
        });
        const maxSize = 500;
        const scale = Math.min(maxSize / imgEl.width, maxSize / imgEl.height, 1);
        img.scale(scale);
        const id = uuidv4();
        (img as fabric.FabricObject & { id?: string }).id = id;
        (img as fabric.FabricObject & { name?: string }).name = file.name;
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        historyManager.saveState();
      };
      imgEl.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 p-1.5 flex flex-col gap-0.5">
        <ToolButton tool="select" icon={<MousePointer2 size={18} />} label="Select" shortcut="V" />
        <ToolButton tool="hand" icon={<Hand size={18} />} label="Hand" shortcut="H" />

        <div className="w-full h-px bg-gray-100 my-1" />

        <ToolButton tool="frame" icon={<Frame size={18} />} label="Frame" shortcut="F" />
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
        <ToolButton
          tool="image"
          icon={<ImageIcon size={18} />}
          label="Image"
          shortcut="I"
          onClick={() => imageInputRef.current?.click()}
        />
        <ToolButton tool="eyedropper" icon={<Pipette size={18} />} label="Eyedropper" shortcut="E" />
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
