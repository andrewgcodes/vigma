'use client'
interface Props { visible: boolean; onAlign: (type: string) => void; onDistribute: (type: string) => void }
// Feature 443: ObjectAlignmentBar
export default function ObjectAlignmentBar({ visible, onAlign, onDistribute }: Props) {
  if (!visible) return null
  const aligns = [{id:'left',label:'L'},{id:'center',label:'C'},{id:'right',label:'R'},{id:'top',label:'T'},{id:'middle',label:'M'},{id:'bottom',label:'B'}]
  return (<div className="flex items-center gap-1 px-3 py-1.5 border-b"><span className="text-xs text-gray-400 mr-1">Align:</span>{aligns.map(a => <button key={a.id} onClick={() => onAlign(a.id)} className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200" title={a.id}>{a.label}</button>)}<span className="text-xs text-gray-400 mx-1">|</span><button onClick={() => onDistribute('horizontal')} className="px-2 py-0.5 text-xs bg-gray-100 rounded">DH</button><button onClick={() => onDistribute('vertical')} className="px-2 py-0.5 text-xs bg-gray-100 rounded">DV</button></div>)
}