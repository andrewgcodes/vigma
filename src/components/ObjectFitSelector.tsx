'use client'
interface Props { fit: string; onChange: (f: string) => void; position: string; onPositionChange: (p: string) => void }
// Feature 575: ObjectFitSelector
export default function ObjectFitSelector({ fit, onChange, position, onPositionChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Object Fit</div><div className="flex gap-1 mb-2">{['fill','contain','cover','none','scale-down'].map(f => <button key={f} onClick={() => onChange(f)} className={'px-2 py-0.5 text-[10px] rounded border ' + (fit===f?'bg-blue-50 border-blue-300':'')}>{f}</button>)}</div><div className="text-xs text-gray-400 mb-1">Position</div><select value={position} onChange={e => onPositionChange(e.target.value)} className="w-full text-xs border rounded px-2 py-1"><option>center</option><option>top</option><option>bottom</option><option>left</option><option>right</option></select></div>)
}