'use client'
interface Props { tags: string[]; onAddTag: (tag: string) => void; onRemoveTag: (tag: string) => void }
// Feature 485: ObjectTagsEditor
export default function ObjectTagsEditor({ tags, onAddTag, onRemoveTag }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Tags</div><div className="flex flex-wrap gap-1 mb-2">{tags.map(t => <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 rounded flex items-center gap-1">{t}<button onClick={() => onRemoveTag(t)} className="text-gray-400 text-[10px]">&times;</button></span>)}</div><input placeholder="Add tag..." onKeyDown={e => {if(e.key==='Enter' && (e.target as HTMLInputElement).value){onAddTag((e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value=''}}} className="w-full px-2 py-1 text-xs border rounded" /></div>)
}