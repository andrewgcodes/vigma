'use client'
interface Notification { id: string; message: string; timestamp: number; read: boolean; type: 'info'|'warning'|'success' }
interface Props { open: boolean; onClose: () => void; notifications: Notification[]; onMarkRead: (id: string) => void; onClearAll: () => void }
export default function NotificationsPanel({ open, onClose, notifications, onMarkRead, onClearAll }: Props) {
  if (!open) return null
  return (
    <div className="fixed right-4 top-12 w-[300px] bg-white rounded-lg shadow-xl border z-[200] max-h-[400px] flex flex-col">
      <div className="flex justify-between items-center p-3 border-b"><span className="text-sm font-semibold">Notifications</span><div className="flex gap-2"><button onClick={onClearAll} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button><button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button></div></div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length===0 && <div className="p-8 text-center text-xs text-gray-400">No notifications</div>}
        {notifications.map(n => <button key={n.id} onClick={() => onMarkRead(n.id)} className={`w-full text-left p-3 border-b hover:bg-gray-50 ${n.read?'opacity-60':''}`}><div className="text-sm">{n.message}</div><div className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</div></button>)}
      </div>
    </div>
  )
}
