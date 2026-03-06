'use client'
interface ExportEntry { id: string; format: string; timestamp: number; filename: string }
interface Props { open: boolean; onClose: () => void; history: ExportEntry[] }
export default function ExportHistoryPanel({ open, onClose, history }: Props) {
  if (!open) return null
  return (<div className="fixed right-4 top-12 w-[300px] bg-white rounded-lg shadow-xl border z-[200] max-h-[400px] flex flex-col">
    <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Export History</span><button onClick={onClose} className="text-gray-400">&times;</button></div>
    <div className="flex-1 overflow-y-auto">{history.length===0 ? <div className="p-8 text-center text-xs text-gray-400">No exports yet</div> : history.map(e => <div key={e.id} className="p-3 border-b"><div className="text-sm">{e.filename}</div><div className="text-xs text-gray-400">{e.format.toUpperCase()} - {new Date(e.timestamp).toLocaleString()}</div></div>)}</div>
  </div>)
}