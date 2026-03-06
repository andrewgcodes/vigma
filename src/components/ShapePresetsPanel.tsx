'use client'
interface Props { onAddShape: (type: string) => void }
// Feature 479: ShapePresetsPanel
export default function ShapePresetsPanel({ onAddShape }: Props) {
  const shapes = ['rectangle','ellipse','triangle','star','pentagon','hexagon','arrow','heart','diamond','cross']
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Shape Presets</div><div className="grid grid-cols-5 gap-1">{shapes.map(s => <button key={s} onClick={() => onAddShape(s)} className="aspect-square border rounded hover:bg-gray-50 flex items-center justify-center text-[10px] text-gray-500 capitalize">{s[0].toUpperCase()}</button>)}</div></div>)
}