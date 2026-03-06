'use client'
interface Props { x: number; y: number; visible: boolean }
// Feature 598: CursorPositionDisplay
export default function CursorPositionDisplay({ x, y, visible }: Props) {
  if (!visible) return null
  return (<div className="fixed bottom-1 left-20 bg-gray-800/80 text-white text-[10px] font-mono px-2 py-0.5 rounded z-[100]">X: {Math.round(x)} Y: {Math.round(y)}</div>)
}