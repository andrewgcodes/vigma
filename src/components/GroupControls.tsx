'use client'
interface Props { isGroup: boolean; onGroup: () => void; onUngroup: () => void; onEnterGroup: () => void }
// Feature 474: GroupControls
export default function GroupControls({ isGroup, onGroup, onUngroup, onEnterGroup }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Group</div><div className="flex gap-1">{isGroup?<><button onClick={onUngroup} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Ungroup</button><button onClick={onEnterGroup} className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Enter</button></>:<button onClick={onGroup} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Group Selected</button>}</div></div>)
}