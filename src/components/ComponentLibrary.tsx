'use client'
interface Props { components: Array<{id:string;name:string;category:string}>; onInsert: (id: string) => void; searchQuery: string; onSearchChange: (q: string) => void }
// Feature 481: ComponentLibrary
export default function ComponentLibrary({ components, onInsert, searchQuery, onSearchChange }: Props) {
  const filtered = components.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Components</div><input value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search..." className="w-full px-2 py-1 text-xs border rounded mb-2" /><div className="space-y-1">{filtered.map(c => <button key={c.id} onClick={() => onInsert(c.id)} className="w-full text-left p-2 border rounded hover:bg-gray-50"><div className="text-xs font-medium">{c.name}</div><div className="text-[10px] text-gray-400">{c.category}</div></button>)}</div></div>)
}