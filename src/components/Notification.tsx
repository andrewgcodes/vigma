'use client'
interface Props { type: string; message: string; onClose: () => void; action?: string; onAction?: () => void }
// Feature 533: Notification
export default function Notification({ type, message, onClose, action, onAction }: Props) {
  const colors = {info:'bg-blue-50 border-blue-200 text-blue-700',success:'bg-green-50 border-green-200 text-green-700',warning:'bg-yellow-50 border-yellow-200 text-yellow-700',error:'bg-red-50 border-red-200 text-red-700'}
  return (<div className={'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ' + (colors[type as keyof typeof colors]||colors.info)}><span className="flex-1">{message}</span>{action && onAction && <button onClick={onAction} className="font-medium underline">{action}</button>}<button onClick={onClose} className="opacity-60 hover:opacity-100">&times;</button></div>)
}