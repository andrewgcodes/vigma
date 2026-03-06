'use client'
interface Props { zoom: number; onZoomIn: () => void; onZoomOut: () => void; onZoomFit: () => void; onZoomReset: () => void }
// Feature 593: CanvasZoomControls
export default function CanvasZoomControls({ zoom, onZoomIn, onZoomOut, onZoomFit, onZoomReset }: Props) {
  return (<div className="flex items-center gap-1 bg-white rounded-lg shadow border p-1"><button onClick={onZoomOut} className="w-7 h-7 flex items-center justify-center text-xs hover:bg-gray-100 rounded">-</button><span className="text-xs w-12 text-center">{Math.round(zoom*100)}%</span><button onClick={onZoomIn} className="w-7 h-7 flex items-center justify-center text-xs hover:bg-gray-100 rounded">+</button><div className="w-px h-5 bg-gray-200" /><button onClick={onZoomFit} className="px-2 py-1 text-[10px] hover:bg-gray-100 rounded">Fit</button><button onClick={onZoomReset} className="px-2 py-1 text-[10px] hover:bg-gray-100 rounded">100%</button></div>)
}