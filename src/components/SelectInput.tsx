'use client'
interface Props { value: string; onChange: (v: string) => void; options: Array<{value:string;label:string}>; label?: string }
// Feature 523: SelectInput
export default function SelectInput({ value, onChange, options, label }: Props) {
  return (<div className="flex items-center gap-2">{label && <span className="text-xs text-gray-400">{label}</span>}<select value={value} onChange={e => onChange(e.target.value)} className="flex-1 text-xs border rounded px-2 py-1">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>)
}