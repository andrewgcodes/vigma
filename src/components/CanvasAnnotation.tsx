'use client'
interface Props { x: number; y: number; text: string; color: string; onEdit: () => void; onDelete: () => void }
// Feature 506: CanvasAnnotation
export default function CanvasAnnotation({ x, y, text, color, onEdit, onDelete }: Props) {
  return (<div className="absolute z-[100] group" style={{left:x,top:y}}><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer" style={{background:color}}>!</div><div className="hidden group-hover:block absolute left-8 top-0 bg-white rounded-lg shadow-xl border p-2 w-[200px]"><div className="text-xs">{text}</div><div className="flex gap-1 mt-1"><button onClick={onEdit} className="text-xs text-blue-500">Edit</button><button onClick={onDelete} className="text-xs text-red-500">Delete</button></div></div></div>)
}