'use client'
interface Props { value: string; onChange: (v: string) => void; placeholder?: string; onClear: () => void }
// Feature 528: SearchInput
export default function SearchInput({ value, onChange, placeholder, onClear }: Props) {
  return (<div className="relative"><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder||'Search...'} className="w-full pl-7 pr-7 py-1.5 text-xs border rounded" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S</span>{value && <button onClick={onClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">&times;</button>}</div>)
}