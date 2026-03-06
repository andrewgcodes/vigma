'use client'
interface Props { pattern: string; onChange: (p: string) => void }
// Feature 459: FillPatternSelector
export default function FillPatternSelector({ pattern, onChange }: Props) {
  const patterns = ['solid','linear','radial','diagonal-lines','dots','crosshatch','none']
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Fill Pattern</div><div className="flex flex-wrap gap-1">{patterns.map(p => <button key={p} onClick={() => onChange(p)} className={'px-2 py-1 text-xs rounded border capitalize ' + (pattern===p?'bg-blue-50 border-blue-300 text-blue-600':'')}>{p}</button>)}</div></div>)
}