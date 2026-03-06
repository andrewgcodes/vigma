'use client'
interface Props { zIndex: number; onChange: (z: number) => void; presets: Array<{label:string;value:number}> }
// Feature 570: ZIndexControl
export default function ZIndexControl({ zIndex, onChange, presets }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Z-Index</div><input type="number" value={zIndex} onChange={e => onChange(Number(e.target.value))} className="w-full text-xs border rounded px-2 py-1 mb-2" /><div className="flex flex-wrap gap-1">{presets.map(p => <button key={p.label} onClick={() => onChange(p.value)} className={'px-2 py-0.5 text-[10px] rounded border ' + (zIndex===p.value?'bg-blue-50 border-blue-300':'')}>{p.label}</button>)}</div></div>)
}