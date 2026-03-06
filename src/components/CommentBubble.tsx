'use client'
interface Props { author: string; text: string; timestamp: number; color: string; resolved: boolean; onResolve: () => void }
// Feature 503: CommentBubble
export default function CommentBubble({ author, text, timestamp, color, resolved, onResolve }: Props) {
  return (<div className={'p-2 rounded-lg border mb-1 ' + (resolved?'opacity-50':'')}><div className="flex items-center gap-2 mb-1"><div className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center" style={{background:color}}>{author[0]}</div><span className="text-xs font-medium">{author}</span><span className="text-[10px] text-gray-400">{new Date(timestamp).toLocaleTimeString()}</span></div><div className="text-xs text-gray-600 ml-7">{text}</div>{!resolved && <button onClick={onResolve} className="text-[10px] text-green-500 ml-7 mt-1">Resolve</button>}</div>)
}