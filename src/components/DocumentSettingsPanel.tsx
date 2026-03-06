'use client'
import { useState } from 'react'
interface Props { title: string; description: string; tags: string[]; onTitleChange: (t: string) => void; onDescriptionChange: (d: string) => void; onAddTag: (t: string) => void; onRemoveTag: (t: string) => void }
export default function DocumentSettingsPanel({ title, description, tags, onTitleChange, onDescriptionChange, onAddTag, onRemoveTag }: Props) {
  const [newTag, setNewTag] = useState('')
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Document</div>
    <input value={title} onChange={e => onTitleChange(e.target.value)} className="w-full px-2 py-1 text-sm border rounded mb-2" placeholder="Title" />
    <textarea value={description} onChange={e => onDescriptionChange(e.target.value)} className="w-full px-2 py-1 text-xs border rounded mb-2 h-16 resize-none" placeholder="Description" />
    <div className="flex flex-wrap gap-1 mb-2">{tags.map(t => <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 rounded flex items-center gap-1">{t}<button onClick={() => onRemoveTag(t)} className="text-gray-400">&times;</button></span>)}</div>
    <div className="flex gap-1"><input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag" className="flex-1 px-2 py-1 text-xs border rounded" /><button onClick={() => {if(newTag){onAddTag(newTag);setNewTag('')}}} className="px-2 py-1 text-xs bg-gray-100 rounded">Add</button></div>
  </div>)
}