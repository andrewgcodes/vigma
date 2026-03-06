'use client'
interface Props { used: number; total: number; unit?: string }
// Feature 583: MemoryUsageBar
export default function MemoryUsageBar({ used, total, unit }: Props) {
  const pct = Math.round(used/total*100)
  return (<div className="p-3 border-b"><div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Memory</span><span className="text-gray-400">{used.toFixed(1)} / {total.toFixed(1)} {unit||'MB'}</span></div><div className="w-full h-1.5 bg-gray-200 rounded-full"><div className={'h-full rounded-full ' + (pct>90?'bg-red-500':pct>70?'bg-yellow-500':'bg-green-500')} style={{width:pct+'%'}} /></div></div>)
}