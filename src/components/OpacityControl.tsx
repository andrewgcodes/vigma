'use client'
interface Props { opacity: number; onChange: (o: number) => void }
// Feature 572: OpacityControl
export default function OpacityControl({ opacity, onChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Opacity</div><div className="flex items-center gap-2"><input type="range" min={0} max={100} value={opacity} onChange={e => onChange(Number(e.target.value))} className="flex-1" /><input type="number" min={0} max={100} value={opacity} onChange={e => onChange(Number(e.target.value))} className="w-12 text-xs border rounded px-1 py-0.5 text-center" /><span className="text-xs text-gray-400">%</span></div></div>)
}