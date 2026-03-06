'use client'
interface Props { text: string; opacity: number; fontSize: number; rotation: number }
// Feature 599: CanvasWatermark
export default function CanvasWatermark({ text, opacity, fontSize, rotation }: Props) {
  return (<div className="absolute inset-0 pointer-events-none z-[40] overflow-hidden" style={{opacity:opacity/100}}><div className="absolute inset-0 flex items-center justify-center" style={{transform:'rotate('+rotation+'deg)'}}><div className="text-gray-300 font-bold whitespace-nowrap" style={{fontSize:fontSize+'px'}}>{text}</div></div></div>)
}