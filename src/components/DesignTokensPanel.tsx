'use client'
import { useState } from 'react'
interface Props { open: boolean; onClose: () => void; tokens: Record<string,string>; onSet: (key: string, value: string) => void; onRemove: (key: string) => void }
export default function DesignTokensPanel({ open, onClose, tokens, onSet, onRemove }: Props) {
  const [key, setKey] = useState('')
  const [val, setVal] = useState('')
  if (!open) return null
  return (<div className="fixed left-16 top-12 bottom-0 w-[300px] bg-white border-r shadow-lg z-[150] flex flex-col">
    <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Design Tokens</span><button onClick={onClose} className="text-gray-400">&times;</button></div>
    <div className="p-3 border-b flex gap-1">
      <input value={key} onChange={e => setKey(e.target.value)} placeholder="Token name" className="flex-1 px-2 py-1 text-xs border rounded" />
      <input value={val} onChange={e => setVal(e.target.value)} placeholder="Value" className="flex-1 px-2 py-1 text-xs border rounded" />
      <button onClick={() => { if(key&&val){onSet(key,val);setKey('');setVal('')} }} className="px-2 py-1 text-xs bg-blue-500 text-white rounded">Add</button>
    </div>
    <div className="flex-1 overflow-y-auto">{Object.entries(tokens).map(([k,v]) => <div key={k} className="flex items-center justify-between px-3 py-2 border-b hover:bg-gray-50"><div><div className="text-xs font-mono font-medium">{k}</div><div className="text-xs text-gray-400">{v}</div></div><button onClick={() => onRemove(k)} className="text-xs text-red-400">&times;</button></div>)}</div>
  </div>)
}