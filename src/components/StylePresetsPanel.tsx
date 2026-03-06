'use client'
interface Props { presets: Array<{id:string;name:string;fill:string;stroke:string;shadow:boolean}>; onApply: (id: string) => void }
// Feature 482: StylePresetsPanel
export default function StylePresetsPanel({ presets, onApply }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Style Presets</div><div className="grid grid-cols-3 gap-1">{presets.map(p => <button key={p.id} onClick={() => onApply(p.id)} className="p-2 border rounded hover:bg-gray-50"><div className="w-full h-8 rounded mb-1" style={{background:p.fill,border:'2px solid '+p.stroke}} /><div className="text-[10px] text-gray-500 truncate">{p.name}</div></button>)}</div></div>)
}