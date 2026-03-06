'use client'
interface Props { pinLeft: boolean; pinRight: boolean; pinTop: boolean; pinBottom: boolean; fixWidth: boolean; fixHeight: boolean; onToggle: (constraint: string) => void }
// Feature 487: ResponsiveConstraints
export default function ResponsiveConstraints({ pinLeft, pinRight, pinTop, pinBottom, fixWidth, fixHeight, onToggle }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Responsive</div><div className="grid grid-cols-3 gap-1">{[{id:'pinLeft',l:'Pin L',v:pinLeft},{id:'pinRight',l:'Pin R',v:pinRight},{id:'pinTop',l:'Pin T',v:pinTop},{id:'pinBottom',l:'Pin B',v:pinBottom},{id:'fixWidth',l:'Fix W',v:fixWidth},{id:'fixHeight',l:'Fix H',v:fixHeight}].map(c => <button key={c.id} onClick={() => onToggle(c.id)} className={'px-2 py-1 text-xs rounded border ' + (c.v?'bg-blue-50 border-blue-300 text-blue-600':'')}>{c.l}</button>)}</div></div>)
}