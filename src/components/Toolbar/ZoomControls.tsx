import { ZoomIn, ZoomOut } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';

export default function ZoomControls() {
  const { state, dispatch, canvasRef } = useAppContext();
  const zoomPercent = Math.round(state.zoom * 100);

  const handleZoom = (delta: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newZoom = Math.min(5, Math.max(0.1, state.zoom + delta));
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(center, newZoom);
    dispatch({ type: 'SET_ZOOM', zoom: newZoom });
  };

  const resetZoom = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(center, 1);
    dispatch({ type: 'SET_ZOOM', zoom: 1 });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        className="w-7 h-7 flex items-center justify-center text-[#a0a0a0] hover:bg-[#3c3c3c] rounded cursor-pointer"
        onClick={() => handleZoom(-0.1)}
        title="Zoom Out"
      >
        <ZoomOut size={16} />
      </button>
      <button
        className="text-white text-xs min-w-12 text-center hover:bg-[#3c3c3c] rounded px-1 h-7 cursor-pointer"
        onClick={resetZoom}
        title="Reset Zoom (click)"
      >
        {zoomPercent}%
      </button>
      <button
        className="w-7 h-7 flex items-center justify-center text-[#a0a0a0] hover:bg-[#3c3c3c] rounded cursor-pointer"
        onClick={() => handleZoom(0.1)}
        title="Zoom In"
      >
        <ZoomIn size={16} />
      </button>
    </div>
  );
}
