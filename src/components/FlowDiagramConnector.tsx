'use client'
interface Props { from: string; to: string; style: string; onStyleChange: (s: string) => void; onRemove: () => void }
// Feature 494: FlowDiagramConnector
export default function FlowDiagramConnector({ from, to, style, onStyleChange, onRemove }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Connector</div><div className="text-xs mb-2">{from} &rarr; {to}</div><div className="flex gap-1 mb-2">{['straight','curved','step'].map(s => <button key={s} onClick={() => onStyleChange(s)} className={'px-2 py-0.5 text-xs rounded border capitalize ' + (style===s?'bg-blue-50 border-blue-300':'')}>{s}</button>)}</div><button onClick={onRemove} className="text-xs text-red-500">Remove</button></div>)
}