'use client'
interface Props { icons: string[]; onSelect: (icon: string) => void; searchQuery: string; onSearchChange: (q: string) => void }
// Feature 480: IconPicker
export default function IconPicker({ icons, onSelect, searchQuery, onSearchChange }: Props) {
  const filtered = icons.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Icons</div><input value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search icons..." className="w-full px-2 py-1 text-xs border rounded mb-2" /><div className="grid grid-cols-6 gap-1 max-h-[120px] overflow-y-auto">{filtered.map(icon => <button key={icon} onClick={() => onSelect(icon)} className="aspect-square border rounded hover:bg-gray-50 flex items-center justify-center text-xs">{icon}</button>)}</div></div>)
}