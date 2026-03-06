'use client'
import { useState } from 'react'
interface Props { open: boolean; onClose: () => void; onFind: (q: string) => void; onReplace: (f: string, r: string) => void; onReplaceAll: (f: string, r: string) => void }
// Feature 402: Find and Replace Dialog
export default function FindReplaceDialog({ open, onClose, onFind, onReplace, onReplaceAll }: Props) {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  if (!open) return null
  return (<div className="fixed top-16 right-4 z-[200] w-[320px] bg-white rounded-lg shadow-xl border p-3">
    <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">Find &amp; Replace</span><button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button></div>
    <input value={find} onChange={e => setFind(e.target.value)} placeholder="Find..." className="w-full px-2 py-1.5 text-sm border rounded mb-2 outline-none" />
    <input value={replace} onChange={e => setReplace(e.target.value)} placeholder="Replace..." className="w-full px-2 py-1.5 text-sm border rounded mb-2 outline-none" />
    <div className="flex gap-1">
      <button onClick={() => onFind(find)} className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Find</button>
      <button onClick={() => onReplace(find, replace)} className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Replace</button>
      <button onClick={() => onReplaceAll(find, replace)} className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded">Replace All</button>
    </div></div>)
}