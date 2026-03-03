import React, { useRef } from 'react';
import {
  PenTool, MousePointer2, Hand, Square, Circle, Triangle, Minus,
  ArrowUpRight, Star, Type, Pencil, Image, Undo2, Redo2, Download,
} from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { ToolType } from '../../types';
import ToolButton from './ToolButton';
import ZoomControls from './ZoomControls';

interface ToolbarProps {
  canvasRef: React.RefObject<{ zoomTo: (zoom: number) => void } | null>;
  onImageUpload: () => void;
}

const tools: { tool: ToolType; icon: typeof MousePointer2; tooltip: string; shortcut: string }[] = [
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

export default function Toolbar({ canvasRef, onImageUpload }: ToolbarProps) {
  const { state, setTool, dispatch, undo, redo } = useAppContext();

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return (
    <div className="h-12 bg-[#2c2c2c] border-b border-[#3c3c3c] flex items-center justify-between px-3 select-none">
      {/* Left - Logo */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <PenTool size={18} className="text-[#7c5cfc]" />
        <span className="text-white font-bold text-base">Vigma</span>
      </div>

      {/* Center - Tools */}
      <div className="flex items-center gap-0.5">
        {tools.map((t) => (
          <ToolButton
            key={t.tool}
            icon={t.icon}
            tooltip={t.tooltip}
            active={state.activeTool === t.tool}
            onClick={() => setTool(t.tool)}
          />
        ))}
        <div className="w-px h-6 bg-[#3c3c3c] mx-1" />
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
        <ToolButton
          icon={Type}
          tooltip="Text (X)"
          active={state.activeTool === 'text'}
          onClick={() => setTool('text')}
        />
        <ToolButton
          icon={Pencil}
          tooltip="Pencil (P)"
          active={state.activeTool === 'pencil'}
          onClick={() => setTool('pencil')}
        />
        <div className="w-px h-6 bg-[#3c3c3c] mx-1" />
        <ToolButton
          icon={Image}
          tooltip="Add Image"
          onClick={onImageUpload}
        />
        <div className="w-px h-6 bg-[#3c3c3c] mx-1" />
        <ToolButton
          icon={Undo2}
          tooltip="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={undo}
        />
        <ToolButton
          icon={Redo2}
          tooltip="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={redo}
        />
      </div>

      {/* Right - Zoom + Export */}
      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        <ZoomControls canvasRef={canvasRef} />
        <button
          className="flex items-center gap-1.5 bg-[#7c5cfc] text-white rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-[#6a4de0] transition-colors"
          onClick={() => dispatch({ type: 'SHOW_EXPORT_MODAL' })}
        >
          <Download size={16} />
          Export
        </button>
      </div>
    </div>
  );
}
