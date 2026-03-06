'use client'
interface Props { title: string; description: string; actionLabel?: string; onAction?: () => void }
// Feature 510: EmptyStateMessage
export default function EmptyStateMessage({ title, description, actionLabel, onAction }: Props) {
  return (<div className="flex flex-col items-center justify-center py-12 px-4"><div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><span className="text-xl text-gray-400">+</span></div><div className="text-sm font-medium text-gray-600 mb-1">{title}</div><div className="text-xs text-gray-400 text-center mb-3">{description}</div>{actionLabel && onAction && <button onClick={onAction} className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">{actionLabel}</button>}</div>)
}