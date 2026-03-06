'use client'
interface Props { trigger: React.ReactNode; items: Array<{label:string;onClick:()=>void;disabled?:boolean}>; open: boolean; onToggle: () => void }
// Feature 515: DropdownMenu
export default function DropdownMenu({ trigger, items, open, onToggle }: Props) {
  return (<div className="relative inline-block"><div onClick={onToggle}>{trigger}</div>{open && <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border py-1 min-w-[150px] z-[200]">{items.map((item,i) => <button key={i} onClick={() => {item.onClick();onToggle()}} disabled={item.disabled} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 disabled:opacity-40">{item.label}</button>)}</div>}</div>)
}