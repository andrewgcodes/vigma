import { useRef } from 'react';
import {
  PenTool, MousePointer2, Hand, Square, Circle, Triangle as TriangleIcon,
  Minus, ArrowUpRight, Star, Type, Pencil, Image, Undo2, Redo2, Download,
} from 'lucide-react';
import ToolButton from './ToolButton';
import ZoomControls from './ZoomControls';
import { useAppContext } from '../../store/canvasStore';
import type { ToolType } from '../../types';

const tools: { type: ToolType; icon: React.ReactNode; shortcut: string; label: string }[] = [
  { type: 'select', icon: <MousePointer2 size={20} />, shortcut: 'V', label: 'Select' },
  { type: 'hand', icon: <Hand size={20} />, shortcut: 'H', label: 'Hand' },
];

const shapeTools: { type: ToolType; icon: React.ReactNode; shortcut: string; label: string }[] = [
  { type: 'rectangle', icon: <Square size={20} />, shortcut: 'R', label: 'Rectangle' },
  { type: 'ellipse', icon: <Circle size={20} />, shortcut: 'O', label: 'Ellipse' },
  { type: 'triangle', icon: <TriangleIcon size={20} />, shortcut: 'T', label: 'Triangle' },
  { type: 'line', icon: <Minus size={20} />, shortcut: 'L', label: 'Line' },
  { type: 'arrow', icon: <ArrowUpRight size={20} />, shortcut: 'A', label: 'Arrow' },
  { type: 'star', icon: <Star size={20} />, shortcut: 'S', label: 'Star' },
];

const drawTools: { type: ToolType; icon: React.ReactNode; shortcut: string; label: string }[] = [
  { type: 'text', icon: <Type size={20} />, shortcut: 'X', label: 'Text' },
  { type: 'pencil', icon: <Pencil size={20} />, shortcut: 'P', label: 'Pencil' },
];

function Separator() {
  return <div className="w-px h-6 bg-[#3c3c3c] mx-1" />;
}

export default function Toolbar() {
  const { state, dispatch } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const event = new CustomEvent('vigma:image-upload', { detail: file });
    window.dispatchEvent(event);
    e.target.value = '';
  };

  const handleUndo = () => {
    window.dispatchEvent(new CustomEvent('vigma:undo'));
  };

  const handleRedo = () => {
    window.dispatchEvent(new CustomEvent('vigma:redo'));
  };

  return (
    <div className="h-12 bg-[#2c2c2c] border-b border-[#3c3c3c] flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-2">
        <PenTool size={18} className="text-[#7c5cfc]" />
        <span className="text-white font-bold text-base">Vigma</span>
      </div>

      <div className="flex items-center gap-0.5">
        {tools.map((t) => (
          <ToolButton
            key={t.type}
            icon={t.icon}
            tooltip={`${t.label} (${t.shortcut})`}
            active={state.activeTool === t.type}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: t.type })}
          />
        ))}
        <Separator />
        {shapeTools.map((t) => (
          <ToolButton
            key={t.type}
            icon={t.icon}
            tooltip={`${t.label} (${t.shortcut})`}
            active={state.activeTool === t.type}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: t.type })}
          />
        ))}
        <Separator />
        {drawTools.map((t) => (
          <ToolButton
            key={t.type}
            icon={t.icon}
            tooltip={`${t.label} (${t.shortcut})`}
            active={state.activeTool === t.type}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: t.type })}
          />
        ))}
        <Separator />
        <ToolButton
          icon={<Image size={20} />}
          tooltip="Add Image"
          onClick={handleImageUpload}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Separator />
        <ToolButton
          icon={<Undo2 size={20} />}
          tooltip="Undo (Ctrl+Z)"
          disabled={state.historyIndex <= 0}
          onClick={handleUndo}
        />
        <ToolButton
          icon={<Redo2 size={20} />}
          tooltip="Redo (Ctrl+Shift+Z)"
          disabled={state.historyIndex >= state.history.length - 1}
          onClick={handleRedo}
        />
      </div>

      <div className="flex items-center gap-3">
        <ZoomControls />
        <button
          className="flex items-center gap-1.5 bg-[#7c5cfc] text-white rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-[#6a4de0] transition-colors cursor-pointer"
          onClick={() => dispatch({ type: 'SHOW_EXPORT_MODAL' })}
        >
          <Download size={16} />
          Export
        </button>
      </div>
    </div>
  );
}
