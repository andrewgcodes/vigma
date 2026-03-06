'use client'
interface Props { users: Array<{name:string;color:string}>; max?: number }
// Feature 518: AvatarStack
export default function AvatarStack({ users, max }: Props) {
  const shown = users.slice(0, max || 5)
  const remaining = users.length - shown.length
  return (<div className="flex -space-x-2">{shown.map((u,i) => <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{background:u.color,zIndex:shown.length-i}}>{u.name[0]}</div>)}{remaining > 0 && <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-500" style={{zIndex:0}}>+{remaining}</div>}</div>)
}