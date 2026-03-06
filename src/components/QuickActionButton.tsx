'use client'
interface Props { label: string; icon?: string; onClick: () => void; variant?: string }
// Feature 452: QuickActionButton
export default function QuickActionButton({ label, icon, onClick, variant }: Props) {
  return (<button onClick={onClick} className={'px-3 py-1.5 text-xs rounded border transition-colors ' + (variant==='primary'?'bg-blue-500 text-white border-blue-500 hover:bg-blue-600':variant==='danger'?'bg-red-50 text-red-600 border-red-200 hover:bg-red-100':'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>{icon && <span className="mr-1">{icon}</span>}{label}</button>)
}