'use client'
interface Props { style: string; onChange: (s: string) => void }
// Feature 469: TextListStyleSelector
export default function TextListStyleSelector({ style, onChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">List Style</div><div className="flex gap-1">{['none','bullet','numbered','checkbox','dash'].map(s => <button key={s} onClick={() => onChange(s)} className={'px-2 py-0.5 text-xs rounded border capitalize ' + (style===s?'bg-blue-50 border-blue-300':'')}>{s}</button>)}</div></div>)
}