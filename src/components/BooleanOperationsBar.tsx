'use client'
interface Props { onUnion: () => void; onSubtract: () => void; onIntersect: () => void; onExclude: () => void; disabled: boolean }
// Feature 467: BooleanOperationsBar
export default function BooleanOperationsBar({ onUnion, onSubtract, onIntersect, onExclude, disabled }: Props) {
  return (<div className="flex gap-1 p-2">{[{l:'Union',fn:onUnion},{l:'Subtract',fn:onSubtract},{l:'Intersect',fn:onIntersect},{l:'Exclude',fn:onExclude}].map(op=><button key={op.l} onClick={op.fn} disabled={disabled} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40">{op.l}</button>)}</div>)
}