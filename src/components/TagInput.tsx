'use client'
interface Props { tags: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void; placeholder?: string }
// Feature 529: TagInput
export default function TagInput({ tags, onAdd, onRemove, placeholder }: Props) {
  return (<div className="flex flex-wrap gap-1 p-1 border rounded min-h-[32px]">{tags.map(t => <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">{t}<button onClick={() => onRemove(t)} className="text-blue-400">&times;</button></span>)}<input placeholder={placeholder||'Add...'} onKeyDown={e => {if(e.key==='Enter'&&(e.target as HTMLInputElement).value){onAdd((e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value=''}}} className="flex-1 min-w-[60px] text-xs outline-none px-1" /></div>)
}