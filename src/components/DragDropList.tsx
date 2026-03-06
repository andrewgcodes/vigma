'use client'
interface Props { items: Array<{id:string;label:string}>; onReorder: (from: number, to: number) => void }
// Feature 545: DragDropList
export default function DragDropList({ items, onReorder }: Props) {
  return (<div className="space-y-1">{items.map((item,i) => <div key={item.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain',String(i))} onDragOver={e => e.preventDefault()} onDrop={e => {const from=Number(e.dataTransfer.getData('text/plain'));onReorder(from,i)}} className="flex items-center gap-2 px-2 py-1.5 bg-white border rounded cursor-move hover:bg-gray-50"><span className="text-gray-400 text-xs">::</span><span className="text-xs">{item.label}</span></div>)}</div>)
}