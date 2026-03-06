'use client'
interface Props { open: boolean; itemName: string; onDelete: () => void; onCancel: () => void }
// Feature 587: DeleteConfirmDialog
export default function DeleteConfirmDialog({ open, itemName, onDelete, onCancel }: Props) {
  if (!open) return null
  return (<div className="fixed inset-0 z-[9999] flex items-center justify-center"><div className="absolute inset-0 bg-black/30" onClick={onCancel} /><div className="relative w-[320px] bg-white rounded-xl shadow-2xl p-4"><div className="text-sm font-semibold mb-2">Delete {itemName}?</div><div className="text-xs text-gray-600 mb-4">This action cannot be undone.</div><div className="flex justify-end gap-2"><button onClick={onCancel} className="px-3 py-1.5 text-xs bg-gray-100 rounded">Cancel</button><button onClick={onDelete} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded">Delete</button></div></div></div>)
}