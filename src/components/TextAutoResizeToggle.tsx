'use client'
interface Props { autoResize: boolean; onToggle: () => void; mode: string; onModeChange: (m: string) => void }
// Feature 483: TextAutoResizeToggle
export default function TextAutoResizeToggle({ autoResize, onToggle, mode, onModeChange }: Props) {
  return (<div className="p-3 border-b"><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Auto Resize</span><button onClick={onToggle} className={'px-2 py-0.5 text-xs rounded ' + (autoResize?'bg-blue-100 text-blue-600':'bg-gray-100')}>{autoResize?'On':'Off'}</button></div>{autoResize && <div className="flex gap-1">{['width','height','both'].map(m => <button key={m} onClick={() => onModeChange(m)} className={'flex-1 px-2 py-0.5 text-xs rounded border capitalize ' + (mode===m?'bg-blue-50 border-blue-300':'')}>{m}</button>)}</div>}</div>)
}