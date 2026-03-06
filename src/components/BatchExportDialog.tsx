'use client'
interface ExportItem { id: string; name: string; format: string; scale: number }
interface Props { open: boolean; onClose: () => void; items: ExportItem[]; onExport: () => void; onItemChange: (id: string, field: string, value: string | number) => void }
export default function BatchExportDialog({ open, onClose, items, onExport, onItemChange }: Props) {
  if (!open) return null
  return (<div className="fixed inset-0 z-[9999] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
    <div className="relative w-[480px] bg-white rounded-xl shadow-2xl p-4">
      <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Batch Export</span><button onClick={onClose} className="text-gray-400">&times;</button></div>
      <div className="max-h-[300px] overflow-y-auto">{items.map(item => (<div key={item.id} className="flex items-center gap-2 p-2 border rounded mb-2">
        <span className="text-xs flex-1 truncate">{item.name}</span>
        <select value={item.format} onChange={e => onItemChange(item.id, 'format', e.target.value)} className="text-xs border rounded px-1 py-0.5"><option>PNG</option><option>SVG</option><option>JPG</option></select>
        <select value={item.scale} onChange={e => onItemChange(item.id, 'scale', Number(e.target.value))} className="text-xs border rounded px-1 py-0.5"><option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option></select>
      </div>))}</div>
      <button onClick={onExport} className="w-full mt-3 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Export All</button>
    </div>
  </div>)
}