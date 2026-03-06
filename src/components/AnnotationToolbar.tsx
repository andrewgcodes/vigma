'use client'
interface Props { tool: string; onToolChange: (t: string) => void; color: string; onColorChange: (c: string) => void }
// Feature 502: AnnotationToolbar
export default function AnnotationToolbar({ tool, onToolChange, color, onColorChange }: Props) {
  return (<div className="fixed top-14 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border px-3 py-2 flex items-center gap-2 z-[200]">{['pen','highlighter','arrow','text','eraser'].map(t => <button key={t} onClick={() => onToolChange(t)} className={'px-2 py-1 text-xs rounded capitalize ' + (tool===t?'bg-blue-100 text-blue-600':'')}>{t}</button>)}<input type="color" value={color} onChange={e => onColorChange(e.target.value)} className="w-6 h-6 ml-2" /></div>)
}