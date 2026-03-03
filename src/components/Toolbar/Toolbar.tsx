import React from 'react';
import {
  PenTool, Undo2, Redo2, Download,
} from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import ToolButton from './ToolButton';
import ZoomControls from './ZoomControls';

interface ToolbarProps {
  canvasRef: React.RefObject<{ zoomTo: (zoom: number) => void; performUndo?: () => void; performRedo?: () => void } | null>;
  onImageUpload: () => void;
}

export default function Toolbar({ canvasRef, onImageUpload }: ToolbarProps) {
  const { state, dispatch } = useAppContext();

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return (
    <div className="h-12 bg-[#2c2c2c] border-b border-[#3c3c3c] flex items-center justify-between px-3 select-none">
      {/* Left - Logo */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <PenTool size={18} className="text-[#7c5cfc]" />
        <span className="text-white font-bold text-base">Vigma</span>
      </div>

      {/* Center - Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={Undo2}
          tooltip="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={() => canvasRef.current?.performUndo?.()}
        />
        <ToolButton
          icon={Redo2}
          tooltip="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={() => canvasRef.current?.performRedo?.()}
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
