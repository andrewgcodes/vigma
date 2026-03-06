'use client'
interface Props { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; label?: string }
// Feature 522: SliderInput
export default function SliderInput({ value, onChange, min, max, step, label }: Props) {
  return (<div className="flex items-center gap-2">{label && <span className="text-xs text-gray-400 w-16">{label}</span>}<input type="range" min={min} max={max} step={step||1} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1" /><span className="text-xs text-gray-500 w-8 text-right">{value}</span></div>)
}