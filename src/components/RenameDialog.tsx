'use client'
interface Props { open: boolean; currentName: string; onRename: (name: string) => void; onCancel: () => void }
// Feature 586: RenameDialog
export default function RenameDialog({ open, currentName, onRename, onCancel }: Props) {
  if (!open) return null
  return (<div className="fixed inset-0 z-[9999] flex items-center justify-center"><div className="absolute inset-0 bg-black/30" onClick={onCancel} /><div className="relative w-[320px] bg-white rounded-xl shadow-2xl p-4"><div className="text-sm font-semibold mb-2">Rename</div><input autoFocus defaultValue={currentName} onKeyDown={e => {if(e.key==='Enter')onRename((e.target as HTMLInputElement).value)}} className="w-full text-xs border rounded px-2 py-1.5 mb-3" /><div className="flex justify-end gap-2"><button onClick={onCancel} className="px-3 py-1.5 text-xs bg-gray-100 rounded">Cancel</button><button onClick={() => {const i=document.querySelector('input');if(i)onRename(i.value)}} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded">Rename</button></div></div></div>)
}