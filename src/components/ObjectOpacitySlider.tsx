'use client'
interface Props { opacity: number; onChange: (o: number) => void }
// Feature 477: ObjectOpacitySlider
export default function ObjectOpacitySlider({ opacity, onChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Opacity</div><div className="flex items-center gap-2"><input type="range" min={0} max={100} value={opacity} onChange={e => onChange(Number(e.target.value))} className="flex-1" /><span className="text-xs w-8 text-right">{opacity}%</span></div></div>)
}