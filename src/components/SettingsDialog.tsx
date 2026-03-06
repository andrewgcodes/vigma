'use client'
interface Props { open: boolean; onClose: () => void; settings: Record<string,boolean>; onToggle: (key: string) => void }
// Feature 589: SettingsDialog
export default function SettingsDialog({ open, onClose, settings, onToggle }: Props) {
  if (!open) return null
  return (<div className="fixed inset-0 z-[9999] flex items-center justify-center"><div className="absolute inset-0 bg-black/30" onClick={onClose} /><div className="relative w-[400px] bg-white rounded-xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto"><div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Settings</span><button onClick={onClose} className="text-gray-400">&times;</button></div>{Object.entries(settings).map(([key,val]) => <div key={key} className="flex items-center justify-between py-2 border-b"><span className="text-xs capitalize">{key.replace(/([A-Z])/g,' $1')}</span><button onClick={() => onToggle(key)} className={'px-2 py-0.5 text-xs rounded ' + (val?'bg-blue-100 text-blue-600':'bg-gray-100')}>{val?'On':'Off'}</button></div>)}</div></div>)
}