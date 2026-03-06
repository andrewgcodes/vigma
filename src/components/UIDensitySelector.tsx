'use client'
interface Props { density: string; onChange: (d: string) => void }
export default function UIDensitySelector({ density, onChange }: Props) {
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">UI Density</div>
    <div className="flex gap-2">{['compact','normal','comfortable'].map(d => <button key={d} onClick={() => onChange(d)} className={'flex-1 px-2 py-1.5 text-xs rounded border capitalize ' + (density===d?'bg-blue-50 border-blue-300 text-blue-600':'')}>{d}</button>)}</div>
  </div>)
}