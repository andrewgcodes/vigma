'use client'
import { useState } from 'react'
interface Props { shortcuts: Record<string,string>; onSet: (action: string, shortcut: string) => void }
export default function ShortcutCustomizer({ shortcuts, onSet }: Props) {
  const [editing, setEditing] = useState<string|null>(null)
  const actions = ['copy','paste','undo','redo','delete','selectAll','group','ungroup','bringFront','sendBack']
  return (<div className="p-3">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Custom Shortcuts</div>
    {actions.map(a => (<div key={a} className="flex items-center justify-between py-1.5 border-b">
      <span className="text-xs capitalize">{a}</span>
      {editing===a ? <input autoFocus onBlur={e => {onSet(a,e.target.value);setEditing(null)}} className="text-xs border rounded px-2 py-0.5 w-24" placeholder="e.g. Ctrl+C" defaultValue={shortcuts[a]||''} /> : <button onClick={() => setEditing(a)} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{shortcuts[a]||'Set'}</button>}
    </div>))}
  </div>)
}