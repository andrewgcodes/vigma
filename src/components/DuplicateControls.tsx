'use client'
interface Props { onDuplicate: () => void; onDuplicateInPlace: () => void; onCloneWithOffset: (dx: number, dy: number) => void }
// Feature 476: DuplicateControls
export default function DuplicateControls({ onDuplicate, onDuplicateInPlace, onCloneWithOffset }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Duplicate</div><div className="flex gap-1"><button onClick={onDuplicate} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Duplicate</button><button onClick={onDuplicateInPlace} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">In Place</button><button onClick={() => onCloneWithOffset(20, 20)} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">+Offset</button></div></div>)
}