'use client'
interface Props { sessionId: string; duration: number; memberCount: number; isHost: boolean }
// Feature 582: SessionInfoBar
export default function SessionInfoBar({ sessionId, duration, memberCount, isHost }: Props) {
  const mins = Math.floor(duration / 60); const secs = duration % 60
  return (<div className="flex items-center gap-3 px-3 py-1 bg-gray-50 border-b text-xs text-gray-500"><span>Session: {sessionId.slice(0,8)}</span><span>{mins}:{secs.toString().padStart(2,'0')}</span><span>{memberCount} member{memberCount!==1?'s':''}</span>{isHost && <span className="text-blue-500">Host</span>}</div>)
}