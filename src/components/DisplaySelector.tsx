'use client'
interface Props { display: string; onChange: (d: string) => void }
// Feature 561: DisplaySelector
export default function DisplaySelector({ display, onChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Display</div><div className="flex flex-wrap gap-1">{['block','inline-block','flex','inline-flex','grid','none','inline','table'].map(d => <button key={d} onClick={() => onChange(d)} className={'px-2 py-0.5 text-xs rounded border ' + (display===d?'bg-blue-50 border-blue-300':'')}>{d}</button>)}</div></div>)
}