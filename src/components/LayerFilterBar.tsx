'use client'
interface Props { filter: string; onFilterChange: (f: string) => void; sort: string; onSortChange: (s: string) => void }
// Feature 406: Layer Filter Bar
export default function LayerFilterBar({ filter, onFilterChange, sort, onSortChange }: Props) {
  return (<div className="flex items-center gap-1 px-2 py-1 border-b bg-gray-50">
    {['all','visible','hidden','locked'].map(f => <button key={f} onClick={() => onFilterChange(f)} className={'px-2 py-0.5 text-xs rounded capitalize ' + (filter===f?'bg-blue-100 text-blue-700':'text-gray-500 hover:bg-gray-100')}>{f}</button>)}
    <select value={sort} onChange={e => onSortChange(e.target.value)} className="ml-auto text-xs border rounded px-1 py-0.5"><option value="default">Default</option><option value="name">Name</option><option value="type">Type</option></select>
  </div>)
}