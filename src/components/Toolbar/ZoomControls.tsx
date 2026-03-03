import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';

interface ZoomControlsProps {
  canvasRef: React.RefObject<{ zoomTo: (zoom: number) => void } | null>;
}

export default function ZoomControls({ canvasRef }: ZoomControlsProps) {
  const { state, setZoom } = useAppContext();
  const zoomPercent = Math.round(state.zoom * 100);

  const handleZoomIn = () => {
    const newZoom = Math.min(5, state.zoom + 0.1);
    setZoom(newZoom);
    canvasRef.current?.zoomTo(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, state.zoom - 0.1);
    setZoom(newZoom);
    canvasRef.current?.zoomTo(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    canvasRef.current?.zoomTo(1);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        className="w-7 h-7 flex items-center justify-center rounded text-[#a0a0a0] hover:bg-[#3c3c3c] transition-colors"
        onClick={handleZoomOut}
      >
        <ZoomOut size={16} />
      </button>
      <button
        className="min-w-[48px] text-center text-white text-xs cursor-pointer hover:bg-[#3c3c3c] rounded px-1 py-1"
        onClick={handleResetZoom}
      >
        {zoomPercent}%
      </button>
      <button
        className="w-7 h-7 flex items-center justify-center rounded text-[#a0a0a0] hover:bg-[#3c3c3c] transition-colors"
        onClick={handleZoomIn}
      >
        <ZoomIn size={16} />
      </button>
    </div>
  );
}
