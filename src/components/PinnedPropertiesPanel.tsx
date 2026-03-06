'use client'
interface Props { pinned: string[]; allProperties: string[]; onTogglePin: (prop: string) => void }
// Feature 440: PinnedPropertiesPanel
export default function PinnedPropertiesPanel({ pinned, allProperties, onTogglePin }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Pinned Properties</div><div className="flex flex-wrap gap-1">{allProperties.map(p => <button key={p} onClick={() => onTogglePin(p)} className={'px-2 py-0.5 text-xs rounded border capitalize ' + (pinned.includes(p)?'bg-blue-50 border-blue-300 text-blue-600':'')}>{p}</button>)}</div></div>)
}