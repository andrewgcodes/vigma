'use client'
interface MenuItem { label: string; shortcut?: string; action: () => void; divider?: boolean; disabled?: boolean; danger?: boolean }
interface Props { x: number; y: number; items: MenuItem[]; onClose: () => void }
export default function ContextMenuEnhanced({ x, y, items, onClose }: Props) {
  return (<div className="fixed inset-0 z-[300]" onClick={onClose}>
    <div className="absolute bg-white rounded-lg shadow-xl border py-1 min-w-[180px]" style={{left:x,top:y}} onClick={e => e.stopPropagation()}>
      {items.map((item, i) => item.divider ? <div key={i} className="border-t my-1" /> : (
        <button key={i} onClick={() => { item.action(); onClose() }} disabled={item.disabled} className={'w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-40 ' + (item.danger?'text-red-500':'')}>
          <span>{item.label}</span>{item.shortcut && <span className="text-xs text-gray-400 ml-4">{item.shortcut}</span>}
        </button>))}
    </div></div>)
}