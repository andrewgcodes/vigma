'use client'
interface Breakpoint { name: string; width: number }
interface Props { breakpoints: Breakpoint[]; active: string; onSelect: (name: string) => void }
export default function BreakpointBar({ breakpoints, active, onSelect }: Props) {
  return (<div className="flex items-center gap-1 px-3 py-1 bg-gray-50 border-b">
    <span className="text-xs text-gray-400 mr-2">Breakpoints:</span>
    {breakpoints.map(bp => <button key={bp.name} onClick={() => onSelect(bp.name)} className={'px-2 py-0.5 text-xs rounded ' + (active===bp.name?'bg-blue-100 text-blue-700':'text-gray-500 hover:bg-gray-100')}>{bp.name} ({bp.width}px)</button>)}
  </div>)
}