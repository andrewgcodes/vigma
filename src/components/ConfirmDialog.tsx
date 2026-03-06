'use client'
interface Props { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; danger?: boolean }
// Feature 511: ConfirmDialog
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel, danger }: Props) {
  if (!open) return null
  return (<div className="fixed inset-0 z-[9999] flex items-center justify-center"><div className="absolute inset-0 bg-black/30" onClick={onCancel} /><div className="relative w-[360px] bg-white rounded-xl shadow-2xl p-4"><div className="text-sm font-semibold mb-2">{title}</div><div className="text-xs text-gray-600 mb-4">{message}</div><div className="flex justify-end gap-2"><button onClick={onCancel} className="px-3 py-1.5 text-xs bg-gray-100 rounded">Cancel</button><button onClick={onConfirm} className={'px-3 py-1.5 text-xs text-white rounded ' + (danger?'bg-red-500':'bg-blue-500')}>{confirmLabel||'Confirm'}</button></div></div></div>)
}