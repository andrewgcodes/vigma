'use client'
interface Props { comments: Array<{id:string;author:string;text:string;timestamp:number}>; onReply: (text: string) => void; onResolve: () => void }
// Feature 504: CommentThread
export default function CommentThread({ comments, onReply, onResolve }: Props) {
  return (<div className="p-2 border rounded-lg mb-2">{comments.map(c => <div key={c.id} className="mb-1"><div className="text-xs font-medium">{c.author}</div><div className="text-xs text-gray-600">{c.text}</div></div>)}<div className="flex gap-1 mt-2"><input placeholder="Reply..." onKeyDown={e => {if(e.key==='Enter'){onReply((e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value=''}}} className="flex-1 px-2 py-1 text-xs border rounded" /><button onClick={onResolve} className="text-xs text-green-500">Resolve</button></div></div>)
}