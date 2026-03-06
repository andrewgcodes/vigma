'use client'
interface Props { label: string; onClick: () => void; options: Array<{label:string;onClick:()=>void}>; open: boolean; onToggle: () => void }
// Feature 527: SplitButton
export default function SplitButton({ label, onClick, options, open, onToggle }: Props) {
  return (<div className="relative inline-flex"><button onClick={onClick} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-l hover:bg-blue-600">{label}</button><button onClick={onToggle} className="px-1.5 py-1.5 text-xs bg-blue-600 text-white rounded-r border-l border-blue-400">&darr;</button>{open && <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border py-1 min-w-[120px] z-[200]">{options.map((o,i) => <button key={i} onClick={() => {o.onClick();onToggle()}} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100">{o.label}</button>)}</div>}</div>)
}