'use client'
import { useState } from 'react'
interface Asset { id: string; name: string; type: string; thumbnail: string }
interface Props { open: boolean; onClose: () => void; assets: Asset[]; onInsert: (id: string) => void; searchQuery: string; onSearchChange: (q: string) => void; category: string; onCategoryChange: (c: string) => void }
export default function AssetLibraryPanel({ open, onClose, assets, onInsert, searchQuery, onSearchChange, category, onCategoryChange }: Props) {
  if (!open) return null
  const filtered = assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (category === 'all' || a.type === category))
  return (
    <div className="fixed left-16 top-12 bottom-0 w-[300px] bg-white border-r shadow-lg z-[150] flex flex-col">
      <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Asset Library</span><button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button></div>
      <div className="px-3 py-2 border-b">
        <input value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search assets..." className="w-full px-2 py-1 text-sm border rounded outline-none" />
        <div className="flex gap-1 mt-2">{['all','icons','images','shapes'].map(c => <button key={c} onClick={() => onCategoryChange(c)} className={`px-2 py-0.5 text-xs rounded capitalize ${category===c?'bg-blue-100 text-blue-700':'text-gray-500'}`}>{c}</button>)}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-2">
        {filtered.map(a => <button key={a.id} onClick={() => onInsert(a.id)} className="aspect-square border rounded p-1 hover:bg-gray-50 flex flex-col items-center justify-center"><div className="w-8 h-8 bg-gray-100 rounded mb-1" /><span className="text-[10px] text-gray-500 truncate w-full text-center">{a.name}</span></button>)}
      </div>
    </div>
  )
}
