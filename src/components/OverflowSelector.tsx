'use client'
interface Props { overflowX: string; overflowY: string; onXChange: (x: string) => void; onYChange: (y: string) => void }
// Feature 559: OverflowSelector
export default function OverflowSelector({ overflowX, overflowY, onXChange, onYChange }: Props) {
  const opts = ['visible','hidden','scroll','auto']
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Overflow</div><div className="grid grid-cols-2 gap-2 text-xs"><div><label className="text-gray-400">X</label><select value={overflowX} onChange={e => onXChange(e.target.value)} className="w-full border rounded px-1 py-0.5">{opts.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="text-gray-400">Y</label><select value={overflowY} onChange={e => onYChange(e.target.value)} className="w-full border rounded px-1 py-0.5">{opts.map(o => <option key={o} value={o}>{o}</option>)}</select></div></div></div>)
}