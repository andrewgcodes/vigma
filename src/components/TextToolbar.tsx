'use client'
interface Props { visible: boolean; fontFamily: string; fontSize: number; bold: boolean; italic: boolean; underline: boolean; align: string; onFontChange: (f: string) => void; onSizeChange: (s: number) => void; onBoldToggle: () => void; onItalicToggle: () => void; onUnderlineToggle: () => void; onAlignChange: (a: string) => void; fonts: string[] }
export default function TextToolbar({ visible, fontFamily, fontSize, bold, italic, underline, align, onFontChange, onSizeChange, onBoldToggle, onItalicToggle, onUnderlineToggle, onAlignChange, fonts }: Props) {
  if (!visible) return null
  return (<div className="fixed top-14 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border px-3 py-2 flex items-center gap-2 z-[200]">
    <select value={fontFamily} onChange={e => onFontChange(e.target.value)} className="text-xs border rounded px-1 py-1 w-[120px]">{fonts.map(f => <option key={f} value={f}>{f}</option>)}</select>
    <input type="number" value={fontSize} onChange={e => onSizeChange(Number(e.target.value))} className="w-12 text-xs border rounded px-1 py-1 text-center" />
    <div className="flex border rounded">
      <button onClick={onBoldToggle} className={'px-2 py-1 text-xs font-bold ' + (bold?'bg-blue-100 text-blue-600':'')}>B</button>
      <button onClick={onItalicToggle} className={'px-2 py-1 text-xs italic ' + (italic?'bg-blue-100 text-blue-600':'')}>I</button>
      <button onClick={onUnderlineToggle} className={'px-2 py-1 text-xs underline ' + (underline?'bg-blue-100 text-blue-600':'')}>U</button>
    </div>
    <div className="flex border rounded">{['left','center','right'].map(a => <button key={a} onClick={() => onAlignChange(a)} className={'px-2 py-1 text-xs ' + (align===a?'bg-blue-100 text-blue-600':'')}>{a[0].toUpperCase()}</button>)}</div>
  </div>)
}