'use client'
interface Effect { type: string; enabled: boolean; value: number }
interface Props { open: boolean; effects: Effect[]; onToggle: (type: string) => void; onValueChange: (type: string, val: number) => void; onAdd: () => void }
export default function EffectsPanel({ open, effects, onToggle, onValueChange, onAdd }: Props) {
  if (!open) return null
  return (<div className="p-3 border-b">
    <div className="flex justify-between items-center mb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Effects</span><button onClick={onAdd} className="text-xs text-blue-500">+ Add</button></div>
    {effects.map((e, i) => (<div key={i} className="flex items-center gap-2 mb-2">
      <input type="checkbox" checked={e.enabled} onChange={() => onToggle(e.type)} className="w-3 h-3" />
      <span className="text-xs flex-1 capitalize">{e.type}</span>
      <input type="range" min={0} max={100} value={e.value} onChange={ev => onValueChange(e.type, Number(ev.target.value))} className="w-20" />
      <span className="text-xs text-gray-400 w-6">{e.value}</span>
    </div>))}
  </div>)
}