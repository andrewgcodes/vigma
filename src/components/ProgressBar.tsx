'use client'
interface Props { progress: number; label: string; variant?: string }
// Feature 508: ProgressBar
export default function ProgressBar({ progress, label, variant }: Props) {
  return (<div className="w-full"><div className="flex justify-between mb-1"><span className="text-xs text-gray-500">{label}</span><span className="text-xs text-gray-400">{Math.round(progress)}%</span></div><div className="w-full h-1.5 bg-gray-200 rounded-full"><div className={'h-full rounded-full transition-all ' + (variant==='success'?'bg-green-500':variant==='warning'?'bg-yellow-500':'bg-blue-500')} style={{width:progress+'%'}} /></div></div>)
}