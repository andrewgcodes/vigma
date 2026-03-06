'use client'
interface Props { size: number; onChange: (s: number) => void; visible: boolean; onToggle: () => void }
// Feature 457: GridSizeControl
export default function GridSizeControl({ size, onChange, visible, onToggle }: Props) {
  return (<div className="p-3 border-b"><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Grid</span><button onClick={onToggle} className={'px-2 py-0.5 text-xs rounded ' + (visible?'bg-blue-100 text-blue-600':'bg-gray-100')}>{visible?'On':'Off'}</button></div><div className="flex items-center gap-2"><span className="text-xs text-gray-400">Size:</span><input type="number" value={size} onChange={e => onChange(Number(e.target.value))} min={1} max={100} className="w-16 text-xs border rounded px-2 py-1" /><span className="text-xs text-gray-400">px</span></div></div>)
}