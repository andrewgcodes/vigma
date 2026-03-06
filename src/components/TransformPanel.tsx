'use client'
interface Props { open: boolean; x: number; y: number; width: number; height: number; rotation: number; onPositionChange: (x: number, y: number) => void; onSizeChange: (w: number, h: number) => void; onRotationChange: (a: number) => void; onReset: () => void; constrain: boolean; onToggleConstrain: () => void }
// Feature 405: Transform Panel
export default function TransformPanel({ open, x, y, width, height, rotation, onPositionChange, onSizeChange, onRotationChange, onReset, constrain, onToggleConstrain }: Props) {
  if (!open) return null
  return (<div className="p-3 border-b">
    <div className="flex justify-between items-center mb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Transform</span><button onClick={onReset} className="text-xs text-blue-500">Reset</button></div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div><label className="text-gray-400">X</label><input type="number" value={Math.round(x)} onChange={e => onPositionChange(Number(e.target.value), y)} className="w-full px-1.5 py-1 border rounded" /></div>
      <div><label className="text-gray-400">Y</label><input type="number" value={Math.round(y)} onChange={e => onPositionChange(x, Number(e.target.value))} className="w-full px-1.5 py-1 border rounded" /></div>
      <div><label className="text-gray-400">W</label><input type="number" value={Math.round(width)} onChange={e => onSizeChange(Number(e.target.value), height)} className="w-full px-1.5 py-1 border rounded" /></div>
      <div><label className="text-gray-400">H</label><input type="number" value={Math.round(height)} onChange={e => onSizeChange(width, Number(e.target.value))} className="w-full px-1.5 py-1 border rounded" /></div>
      <div><label className="text-gray-400">R</label><input type="number" value={Math.round(rotation)} onChange={e => onRotationChange(Number(e.target.value))} className="w-full px-1.5 py-1 border rounded" /></div>
      <div className="flex items-end"><button onClick={onToggleConstrain} className={'w-full px-1.5 py-1 text-xs rounded border ' + (constrain ? 'bg-blue-50 border-blue-300 text-blue-600' : '')}>{constrain ? 'Linked' : 'Free'}</button></div>
    </div></div>)
}