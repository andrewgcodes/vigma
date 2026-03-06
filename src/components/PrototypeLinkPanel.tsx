'use client'
interface Link { from: string; to: string; trigger: string; animation: string }
interface Props { open: boolean; links: Link[]; onAdd: (from: string, to: string) => void; onRemove: (from: string) => void; selectedId: string | null; pages: Array<{id:string;name:string}> }
export default function PrototypeLinkPanel({ open, links, onAdd, onRemove, selectedId, pages }: Props) {
  if (!open) return null
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Prototype</div>
    {selectedId && <div className="mb-2"><div className="text-xs text-gray-500 mb-1">Link to page:</div><select onChange={e => onAdd(selectedId, e.target.value)} className="w-full text-xs border rounded px-2 py-1"><option value="">Select page...</option>{pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}
    {links.map((l, i) => <div key={i} className="flex items-center justify-between p-1.5 bg-gray-50 rounded mb-1 text-xs"><span>{l.from} to {l.to}</span><button onClick={() => onRemove(l.from)} className="text-red-400">&times;</button></div>)}
  </div>)
}