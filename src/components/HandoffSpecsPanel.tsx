'use client'
interface Props { specs: Array<{label:string;value:string}>; onCopy: (value: string) => void }
// Feature 497: HandoffSpecsPanel
export default function HandoffSpecsPanel({ specs, onCopy }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Handoff Specs</div>{specs.map((s,i) => <div key={i} className="flex items-center justify-between py-1 border-b"><span className="text-xs text-gray-400">{s.label}</span><button onClick={() => onCopy(s.value)} className="text-xs font-mono hover:text-blue-500">{s.value}</button></div>)}</div>)
}