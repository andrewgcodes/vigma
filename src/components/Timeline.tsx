'use client'
interface Props { events: Array<{id:string;title:string;description:string;timestamp:number}> }
// Feature 536: Timeline
export default function Timeline({ events }: Props) {
  return (<div className="space-y-0">{events.map((e,i) => <div key={e.id} className="flex gap-3"><div className="flex flex-col items-center"><div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />{i<events.length-1 && <div className="w-px flex-1 bg-gray-200" />}</div><div className="pb-4"><div className="text-xs font-medium">{e.title}</div><div className="text-[10px] text-gray-400">{e.description}</div><div className="text-[10px] text-gray-300">{new Date(e.timestamp).toLocaleString()}</div></div></div>)}</div>)
}