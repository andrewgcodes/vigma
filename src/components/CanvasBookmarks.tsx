'use client'
interface Props { bookmarks: Array<{id:string;name:string;x:number;y:number;zoom:number}>; onGo: (id: string) => void; onAdd: () => void; onRemove: (id: string) => void }
// Feature 505: CanvasBookmarks
export default function CanvasBookmarks({ bookmarks, onGo, onAdd, onRemove }: Props) {
  return (<div className="p-3 border-b"><div className="flex justify-between items-center mb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Bookmarks</span><button onClick={onAdd} className="text-xs text-blue-500">+ Add</button></div>{bookmarks.map(b => <div key={b.id} className="flex items-center justify-between py-1"><button onClick={() => onGo(b.id)} className="text-xs text-blue-600 hover:underline">{b.name}</button><button onClick={() => onRemove(b.id)} className="text-xs text-red-400">&times;</button></div>)}</div>)
}