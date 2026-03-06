'use client'
interface Props { rotation: number; onChange: (angle: number) => void }
// Feature 451: CanvasRotationControl
export default function CanvasRotationControl({ rotation, onChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Canvas Rotation</div><div className="flex items-center gap-2"><input type="range" min={0} max={360} value={rotation} onChange={e => onChange(Number(e.target.value))} className="flex-1" /><span className="text-xs w-10 text-right">{rotation}&deg;</span><button onClick={() => onChange(0)} className="text-xs text-blue-500">Reset</button></div></div>)
}