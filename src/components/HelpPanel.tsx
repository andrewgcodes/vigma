'use client'
import { useState } from 'react'
const helpItems = [
  {title:'Select Tool',content:'Click to select objects.',cat:'Tools'},
  {title:'Drawing',content:'Use pen tool to draw.',cat:'Tools'},
  {title:'Shapes',content:'Add shapes from toolbar.',cat:'Tools'},
  {title:'Text',content:'Click text tool to add text.',cat:'Tools'},
  {title:'Layers',content:'Reorder objects in layers panel.',cat:'Panels'},
  {title:'Export',content:'Export as PNG, SVG, PDF.',cat:'Export'},
  {title:'Collaboration',content:'Share link to collaborate.',cat:'Collab'},
  {title:'Shortcuts',content:'Press ? for shortcuts.',cat:'Tips'},
]
interface Props { open: boolean; onClose: () => void }
export default function HelpPanel({ open, onClose }: Props) {
  const [q, setQ] = useState('')
  if (!open) return null
  const filtered = helpItems.filter(i => i.title.toLowerCase().includes(q.toLowerCase()) || i.content.toLowerCase().includes(q.toLowerCase()))
  return (<div className="fixed right-4 top-12 w-[300px] bg-white rounded-lg shadow-xl border z-[200] max-h-[500px] flex flex-col">
    <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Help</span><button onClick={onClose} className="text-gray-400">&times;</button></div>
    <div className="px-3 py-2 border-b"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search help..." className="w-full px-2 py-1 text-sm border rounded outline-none" /></div>
    <div className="flex-1 overflow-y-auto">{filtered.map((item,i) => <div key={i} className="p-3 border-b"><div className="text-xs text-blue-500 mb-0.5">{item.cat}</div><div className="text-sm font-medium">{item.title}</div><div className="text-xs text-gray-500 mt-0.5">{item.content}</div></div>)}</div>
  </div>)
}