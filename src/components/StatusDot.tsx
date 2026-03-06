'use client'
interface Props { status: string; label?: string; size?: string }
// Feature 534: StatusDot
export default function StatusDot({ status, label, size }: Props) {
  const colors: Record<string,string> = {online:'bg-green-400',offline:'bg-gray-300',busy:'bg-red-400',away:'bg-yellow-400',idle:'bg-gray-400'}
  return (<div className="inline-flex items-center gap-1"><div className={'rounded-full ' + (size==='lg'?'w-3 h-3':'w-2 h-2') + ' ' + (colors[status]||'bg-gray-400')} />{label && <span className="text-xs text-gray-500">{label}</span>}</div>)
}