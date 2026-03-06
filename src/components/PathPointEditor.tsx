'use client'
interface Props { pointCount: number; onAddPoint: () => void; onRemovePoint: () => void; onConvertSmooth: () => void; onConvertCorner: () => void }
// Feature 468: PathPointEditor
export default function PathPointEditor({ pointCount, onAddPoint, onRemovePoint, onConvertSmooth, onConvertCorner }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Path ({pointCount} points)</div><div className="flex gap-1"><button onClick={onAddPoint} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Add</button><button onClick={onRemovePoint} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Remove</button><button onClick={onConvertSmooth} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Smooth</button><button onClick={onConvertCorner} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Corner</button></div></div>)
}