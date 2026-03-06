'use client'
interface Props { units: string; onChange: (u: string) => void }
export default function RulerUnitsSelector({ units, onChange }: Props) {
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Ruler Units</div>
    <div className="flex gap-1">{['px','in','cm','mm','pt'].map(u => <button key={u} onClick={() => onChange(u)} className={'px-3 py-1 text-xs rounded border ' + (units===u?'bg-blue-50 border-blue-300 text-blue-600':'')}>{u}</button>)}</div>
  </div>)
}