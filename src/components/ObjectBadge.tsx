'use client'
interface Props { type: string; name: string; locked: boolean; hidden: boolean }
// Feature 455: ObjectBadge
export default function ObjectBadge({ type, name, locked, hidden }: Props) {
  return (<div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs"><span className="text-gray-400">{type}</span><span className="font-medium truncate max-w-[100px]">{name}</span>{locked && <span className="text-red-400">L</span>}{hidden && <span className="text-gray-300">H</span>}</div>)
}