'use client'
interface Props { onDragStart: () => void; onDragEnd: () => void }
// Feature 596: LayerDragHandle
export default function LayerDragHandle({ onDragStart, onDragEnd }: Props) {
  return (<div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing px-1 py-1" draggable onDragStart={onDragStart} onDragEnd={onDragEnd}><div className="w-3 h-0.5 bg-gray-300 rounded" /><div className="w-3 h-0.5 bg-gray-300 rounded" /><div className="w-3 h-0.5 bg-gray-300 rounded" /></div>)
}