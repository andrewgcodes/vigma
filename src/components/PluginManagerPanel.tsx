'use client'
interface Plugin { id: string; name: string; description: string; enabled: boolean }
interface Props { open: boolean; onClose: () => void; plugins: Plugin[]; onToggle: (id: string) => void }
export default function PluginManagerPanel({ open, onClose, plugins, onToggle }: Props) {
  if (!open) return null
  return (<div className="fixed left-16 top-12 bottom-0 w-[300px] bg-white border-r shadow-lg z-[150] flex flex-col">
    <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Plugins</span><button onClick={onClose} className="text-gray-400">&times;</button></div>
    <div className="flex-1 overflow-y-auto">{plugins.map(p => (<div key={p.id} className="flex items-center gap-3 p-3 border-b">
      <div className="flex-1"><div className="text-sm font-medium">{p.name}</div><div className="text-xs text-gray-400">{p.description}</div></div>
      <button onClick={() => onToggle(p.id)} className={'px-3 py-1 text-xs rounded ' + (p.enabled?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-500')}>{p.enabled?'On':'Off'}</button>
    </div>))}</div>
  </div>)
}