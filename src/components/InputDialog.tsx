'use client'
interface Props { open: boolean; title: string; placeholder: string; defaultValue: string; onSubmit: (value: string) => void; onCancel: () => void }
// Feature 512: InputDialog
export default function InputDialog({ open, title, placeholder, defaultValue, onSubmit, onCancel }: Props) {
  if (!open) return null
  return (<div className="fixed inset-0 z-[9999] flex items-center justify-center"><div className="absolute inset-0 bg-black/30" onClick={onCancel} /><div className="relative w-[360px] bg-white rounded-xl shadow-2xl p-4"><div className="text-sm font-semibold mb-2">{title}</div><input autoFocus defaultValue={defaultValue} placeholder={placeholder} onKeyDown={e => {if(e.key==='Enter')onSubmit((e.target as HTMLInputElement).value)}} className="w-full px-2 py-1.5 text-sm border rounded mb-3" /><div className="flex justify-end gap-2"><button onClick={onCancel} className="px-3 py-1.5 text-xs bg-gray-100 rounded">Cancel</button><button onClick={() => {const inp=document.querySelector('input');if(inp)onSubmit(inp.value)}} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded">OK</button></div></div></div>)
}