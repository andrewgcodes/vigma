'use client'
interface Props { name: string; type: string; width: number; height: number; x: number; y: number }
// Feature 463: ObjectInfoTooltip
export default function ObjectInfoTooltip({ name, type, width, height, x, y }: Props) {
  return (<div className="absolute bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-[300] pointer-events-none whitespace-nowrap" style={{left:x+15,top:y-30}}><div className="font-medium">{name}</div><div className="text-gray-300">{type} - {Math.round(width)} x {Math.round(height)}</div></div>)
}