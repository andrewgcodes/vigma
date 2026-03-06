'use client'
interface Props { frames: Array<{id:string;name:string;width:number;height:number}>; onSelect: (id: string) => void }
// Feature 478: FrameSelector
export default function FrameSelector({ frames, onSelect }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Frames</div><div className="grid grid-cols-2 gap-1">{frames.map(f => <button key={f.id} onClick={() => onSelect(f.id)} className="p-2 border rounded hover:bg-gray-50 text-left"><div className="text-xs font-medium">{f.name}</div><div className="text-[10px] text-gray-400">{f.width}x{f.height}</div></button>)}</div></div>)
}