'use client'
interface Props { open: boolean; onClose: () => void; format: string; onFormatChange: (f: string) => void; code: string }
export default function InspectCodePanel({ open, onClose, format, onFormatChange, code }: Props) {
  if (!open) return null
  return (<div className="fixed right-0 top-12 w-[320px] bg-white border-l shadow-lg z-[150] flex flex-col" style={{height:'calc(100vh - 48px)'}}>
    <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Inspect</span><button onClick={onClose} className="text-gray-400">&times;</button></div>
    <div className="flex gap-1 px-3 py-2 border-b">{['css','tailwind','react','swift'].map(f => <button key={f} onClick={() => onFormatChange(f)} className={'px-2 py-0.5 text-xs rounded capitalize ' + (format===f?'bg-blue-100 text-blue-700':'text-gray-500')}>{f}</button>)}</div>
    <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-gray-700 bg-gray-50">{code}</pre>
  </div>)
}