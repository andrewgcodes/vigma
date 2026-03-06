'use client'
interface Props { data: Record<string, unknown>; collapsed?: boolean }
// Feature 552: JsonViewer
export default function JsonViewer({ data, collapsed }: Props) {
  const entries = Object.entries(data)
  return (<div className="font-mono text-xs">{entries.map(([k,v]) => <div key={k} className="flex gap-2 py-0.5"><span className="text-purple-600">{k}:</span><span className="text-green-600">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span></div>)}</div>)
}