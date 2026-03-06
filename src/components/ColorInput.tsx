'use client'
interface Props { value: string; onChange: (v: string) => void; label?: string }
// Feature 521: ColorInput
export default function ColorInput({ value, onChange, label }: Props) {
  return (<div className="flex items-center gap-2">{label && <span className="text-xs text-gray-400">{label}</span>}<input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer" /><input value={value} onChange={e => onChange(e.target.value)} className="w-20 text-xs font-mono border rounded px-1 py-0.5" /></div>)
}