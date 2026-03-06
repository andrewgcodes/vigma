'use client'
interface Props { name: string; size: number; format: string; created: number; modified: number; pages: number; objects: number }
// Feature 590: FileInfoPanel
export default function FileInfoPanel({ name, size, format, created, modified, pages, objects }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">File Info</div><div className="space-y-1 text-xs">{[{l:'Name',v:name},{l:'Size',v:(size/1024).toFixed(1)+' KB'},{l:'Format',v:format},{l:'Created',v:new Date(created).toLocaleDateString()},{l:'Modified',v:new Date(modified).toLocaleDateString()},{l:'Pages',v:String(pages)},{l:'Objects',v:String(objects)}].map(f => <div key={f.l} className="flex justify-between"><span className="text-gray-400">{f.l}</span><span>{f.v}</span></div>)}</div></div>)
}