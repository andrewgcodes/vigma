'use client'
interface Props { tool: string; brushSize?: number; onBrushSizeChange?: (s: number) => void; brushColor?: string; onBrushColorChange?: (c: string) => void }
// Feature 446: ToolOptionsBar
export default function ToolOptionsBar({ tool, brushSize, onBrushSizeChange, brushColor, onBrushColorChange }: Props) {
  if (!['draw','eraser','pen'].includes(tool)) return null
  return (<div className="fixed top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border px-3 py-2 flex items-center gap-3 z-[200]"><span className="text-xs text-gray-500 capitalize">{tool}</span>{brushSize !== undefined && onBrushSizeChange && <div className="flex items-center gap-1"><span className="text-xs text-gray-400">Size:</span><input type="range" min={1} max={100} value={brushSize} onChange={e => onBrushSizeChange(Number(e.target.value))} className="w-20" /><span className="text-xs w-6">{brushSize}</span></div>}{brushColor !== undefined && onBrushColorChange && <input type="color" value={brushColor} onChange={e => onBrushColorChange(e.target.value)} className="w-6 h-6" />}</div>)
}