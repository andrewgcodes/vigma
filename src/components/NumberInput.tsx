'use client'
interface Props { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }
// Feature 520: NumberInput
export default function NumberInput({ value, onChange, min, max, step, label }: Props) {
  return (<div className="flex items-center gap-1">{label && <span className="text-xs text-gray-400 w-12">{label}</span>}<button onClick={() => onChange(Math.max(min??-Infinity, value-(step||1)))} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs">-</button><input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} step={step} className="w-14 text-xs text-center border rounded px-1 py-1" /><button onClick={() => onChange(Math.min(max??Infinity, value+(step||1)))} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs">+</button></div>)
}