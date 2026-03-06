'use client'
interface Props { conditions: Array<{property:string;operator:string;value:string}>; onAdd: () => void; onRemove: (index: number) => void }
// Feature 496: ConditionalVisibility
export default function ConditionalVisibility({ conditions, onAdd, onRemove }: Props) {
  return (<div className="p-3 border-b"><div className="flex justify-between items-center mb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Visibility Rules</span><button onClick={onAdd} className="text-xs text-blue-500">+ Add</button></div>{conditions.map((c, i) => <div key={i} className="flex items-center gap-1 mb-1"><span className="text-xs flex-1">{c.property} {c.operator} {c.value}</span><button onClick={() => onRemove(i)} className="text-xs text-red-400">&times;</button></div>)}</div>)
}