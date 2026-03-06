'use client'
interface Props { textAlign: string; onAlignChange: (a: string) => void; indent: number; onIndentChange: (i: number) => void }
// Feature 472: ParagraphSettingsPanel
export default function ParagraphSettingsPanel({ textAlign, onAlignChange, indent, onIndentChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Paragraph</div><div className="mb-2"><div className="flex gap-1">{['left','center','right','justify'].map(a => <button key={a} onClick={() => onAlignChange(a)} className={'px-2 py-0.5 text-xs rounded border capitalize ' + (textAlign===a?'bg-blue-50 border-blue-300':'')}>{a}</button>)}</div></div><div className="flex items-center gap-2"><span className="text-xs">Indent</span><input type="number" value={indent} onChange={e => onIndentChange(Number(e.target.value))} className="w-16 text-xs border rounded px-2 py-1" /></div></div>)
}