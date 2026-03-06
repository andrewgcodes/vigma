'use client'
interface Version { id: string; name: string; timestamp: number; thumbnail?: string }
interface Props { open: boolean; onClose: () => void; versions: Version[]; onRestore: (id: string) => void; onDelete: (id: string) => void }
export default function VersionHistoryPanel({ open, onClose, versions, onRestore, onDelete }: Props) {
  if (!open) return null
  return (
    <div className="fixed left-16 top-12 bottom-0 w-[280px] bg-white border-r shadow-lg z-[150] flex flex-col">
      <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Version History</span><button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button></div>
      <div className="flex-1 overflow-y-auto p-2">
        {versions.length === 0 && <div className="text-xs text-gray-400 text-center py-8">No versions saved</div>}
        {versions.map(v => (
          <div key={v.id} className="p-2 border rounded mb-2 hover:bg-gray-50">
            <div className="text-sm font-medium">{v.name}</div>
            <div className="text-xs text-gray-400">{new Date(v.timestamp).toLocaleString()}</div>
            <div className="flex gap-1 mt-1">
              <button onClick={() => onRestore(v.id)} className="text-xs text-blue-500 hover:text-blue-600">Restore</button>
              <button onClick={() => onDelete(v.id)} className="text-xs text-red-500 hover:text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
