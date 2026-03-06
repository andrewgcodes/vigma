'use client'
interface Props { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }
// Feature 524: TextInput
export default function TextInput({ value, onChange, placeholder, label }: Props) {
  return (<div className="flex items-center gap-2">{label && <span className="text-xs text-gray-400">{label}</span>}<input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="flex-1 text-xs border rounded px-2 py-1" /></div>)
}