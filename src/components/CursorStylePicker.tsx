'use client'
interface Props { cursor: string; onChange: (c: string) => void }
// Feature 558: CursorStylePicker
export default function CursorStylePicker({ cursor, onChange }: Props) {
  const cursors = ['default','pointer','move','crosshair','text','wait','not-allowed','grab','zoom-in','zoom-out']
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Cursor</div><div className="grid grid-cols-5 gap-1">{cursors.map(c => <button key={c} onClick={() => onChange(c)} className={'px-1 py-1 text-[10px] rounded border capitalize ' + (cursor===c?'bg-blue-50 border-blue-300':'')} style={{cursor:c}}>{c}</button>)}</div></div>)
}