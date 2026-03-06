'use client'
interface Collaborator { id: string; name: string; color: string; online: boolean }
interface Props { open: boolean; onClose: () => void; collaborators: Collaborator[]; currentUserId: string; onFollowUser: (id: string | null) => void; followingUserId: string | null }
export default function CollaborationPanel({ open, onClose, collaborators, currentUserId, onFollowUser, followingUserId }: Props) {
  if (!open) return null
  return (
    <div className="fixed right-0 top-12 w-[260px] bg-white border-l shadow-lg z-[150] flex flex-col" style={{height:'calc(100vh - 48px)'}}>
      <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Collaborators</span><button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button></div>
      <div className="flex-1 overflow-y-auto p-2">
        {collaborators.map(c => (
          <div key={c.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:c.color}}>{c.name[0]}</div>
            <div className="flex-1"><div className="text-sm">{c.name}{c.id===currentUserId?' (you)':''}</div><div className="text-xs text-gray-400">{c.online?'Online':'Offline'}</div></div>
            {c.id !== currentUserId && <button onClick={() => onFollowUser(followingUserId===c.id?null:c.id)} className={`text-xs px-2 py-0.5 rounded ${followingUserId===c.id?'bg-blue-100 text-blue-600':'text-gray-400 hover:text-gray-600'}`}>{followingUserId===c.id?'Following':'Follow'}</button>}
          </div>
        ))}
      </div>
    </div>
  )
}
