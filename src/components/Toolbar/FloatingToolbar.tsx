import React from 'react';
import {
  MousePointer2, Hand, Square, Circle, Triangle, Minus,
  ArrowUpRight, Star, Type, Pencil, Image, Frame, PenTool,
  Component, ChevronDown,
} from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { ToolType } from '../../types';
import ToolButton from './ToolButton';

interface FloatingToolbarProps {
  onImageUpload: () => void;
}

const mainTools: { tool: ToolType; icon: typeof MousePointer2; tooltip: string; shortcut: string }[] = [
  { tool: 'select', icon: MousePointer2, tooltip: 'Select (V)', shortcut: 'V' },
  { tool: 'hand', icon: Hand, tooltip: 'Hand (H)', shortcut: 'H' },
];

const shapeTools: { tool: ToolType; icon: typeof Square; tooltip: string }[] = [
  { tool: 'rectangle', icon: Square, tooltip: 'Rectangle (R)' },
  { tool: 'ellipse', icon: Circle, tooltip: 'Ellipse (O)' },
  { tool: 'triangle', icon: Triangle, tooltip: 'Triangle (T)' },
  { tool: 'line', icon: Minus, tooltip: 'Line (L)' },
  { tool: 'arrow', icon: ArrowUpRight, tooltip: 'Arrow (A)' },
  { tool: 'star', icon: Star, tooltip: 'Star (S)' },
];

export default function FloatingToolbar({ onImageUpload }: FloatingToolbarProps) {
  const { state, setTool } = useAppContext();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-0.5 bg-[#2c2c2c] rounded-xl px-2 py-1.5 shadow-2xl border border-[#3c3c3c]">
        {/* Move/Hand */}
        {mainTools.map((t) => (
          <ToolButton
            key={t.tool}
            icon={t.icon}
            tooltip={t.tooltip}
            active={state.activeTool === t.tool}
            onClick={() => setTool(t.tool)}
          />
        ))}
        <div className="w-px h-6 bg-[#3c3c3c] mx-1" />

        {/* Frame */}
        <ToolButton
          icon={Frame}
          tooltip="Frame (F)"
          active={state.activeTool === 'frame'}
          onClick={() => setTool('frame')}
        />
        <div className="w-px h-6 bg-[#3c3c3c] mx-1" />

        {/* Shapes */}
        {shapeTools.map((t) => (
          <ToolButton
            key={t.tool}
            icon={t.icon}
            tooltip={t.tooltip}
            active={state.activeTool === t.tool}
            onClick={() => setTool(t.tool)}
          />
        ))}
        <div className="w-px h-6 bg-[#3c3c3c] mx-1" />

        {/* Text */}
        <ToolButton
          icon={Type}
          tooltip="Text (X)"
          active={state.activeTool === 'text'}
          onClick={() => setTool('text')}
        />

        {/* Pencil */}
        <ToolButton
          icon={Pencil}
          tooltip="Pencil (P)"
          active={state.activeTool === 'pencil'}
          onClick={() => setTool('pencil')}
        />

        {/* Pen */}
        <ToolButton
          icon={PenTool}
          tooltip="Pen (N)"
          active={state.activeTool === 'pen'}
          onClick={() => setTool('pen')}
        />
        <div className="w-px h-6 bg-[#3c3c3c] mx-1" />

        {/* Image */}
        <ToolButton
          icon={Image}
          tooltip="Add Image"
          onClick={onImageUpload}
        />

        {/* Component */}
        <ToolButton
          icon={Component}
          tooltip="Create Component"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
