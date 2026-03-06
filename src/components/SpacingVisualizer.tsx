'use client'
interface Props { visible: boolean; top: number; right: number; bottom: number; left: number }
// Feature 444: SpacingVisualizer
export default function SpacingVisualizer({ visible, top, right, bottom, left }: Props) {
  if (!visible) return null
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Spacing</div><div className="relative w-full aspect-square max-w-[120px] mx-auto"><div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded flex items-center justify-center"><div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded" /></div><div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-[10px] text-gray-500">{top}</div><div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-[10px] text-gray-500">{right}</div><div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-[10px] text-gray-500">{bottom}</div><div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-[10px] text-gray-500">{left}</div></div></div>)
}