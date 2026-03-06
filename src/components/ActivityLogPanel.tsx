'use client'
interface Props { logs: Array<{id:string;action:string;user:string;timestamp:number;details:string}>; onClear: () => void }
// Feature 581: ActivityLogPanel
export default function ActivityLogPanel({ logs, onClear }: Props) {
  return (<div className="flex flex-col h-full"><div className="flex justify-between items-center p-3 border-b"><span className="text-xs font-semibold text-gray-500 uppercase">Activity Log</span><button onClick={onClear} className="text-xs text-gray-400">Clear</button></div><div className="flex-1 overflow-y-auto">{logs.map(l => <div key={l.id} className="px-3 py-2 border-b hover:bg-gray-50"><div className="flex items-center gap-2"><span className="text-xs font-medium">{l.user}</span><span className="text-[10px] text-gray-400">{l.action}</span></div><div className="text-[10px] text-gray-400">{l.details} - {new Date(l.timestamp).toLocaleTimeString()}</div></div>)}</div></div>)
}