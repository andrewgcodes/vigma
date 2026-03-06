'use client'
interface Props { visible: boolean; width: number; height: number; zoom: number; objectCount: number; selectedCount: number }
// Feature 436: CanvasInfoBar
export default function CanvasInfoBar({ visible, width, height, zoom, objectCount, selectedCount }: Props) {
  if (!visible) return null
  return (<div className="fixed bottom-0 left-0 right-0 h-6 bg-gray-100 border-t flex items-center justify-between px-4 text-[10px] text-gray-500 z-[100]"><div className="flex gap-4"><span>Canvas: {width} x {height}</span><span>Zoom: {Math.round(zoom * 100)}%</span></div><div className="flex gap-4"><span>Objects: {objectCount}</span>{selectedCount > 0 && <span>Selected: {selectedCount}</span>}</div></div>)
}