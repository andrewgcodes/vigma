'use client'
interface Props { bindings: Array<{property:string;source:string}>; onBind: (property: string, source: string) => void; onUnbind: (property: string) => void; dataSources: string[] }
// Feature 495: DataBindingPanel
export default function DataBindingPanel({ bindings, onBind, onUnbind, dataSources }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Data Binding</div>{bindings.map(b => <div key={b.property} className="flex items-center justify-between py-1"><span className="text-xs">{b.property} &larr; {b.source}</span><button onClick={() => onUnbind(b.property)} className="text-xs text-red-400">&times;</button></div>)}<div className="mt-2 text-xs text-gray-400">Available: {dataSources.join(', ')}</div></div>)
}