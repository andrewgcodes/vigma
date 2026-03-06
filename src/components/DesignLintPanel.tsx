'use client'
interface Props { issues: Array<{type:string;message:string;severity:string}>; onFix: (index: number) => void }
// Feature 498: DesignLintPanel
export default function DesignLintPanel({ issues, onFix }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Design Lint ({issues.length})</div>{issues.length === 0 ? <div className="text-xs text-green-500">No issues found</div> : issues.map((issue,i) => <div key={i} className="flex items-center gap-2 py-1 border-b"><span className={'w-2 h-2 rounded-full ' + (issue.severity==='error'?'bg-red-400':'bg-yellow-400')} /><span className="text-xs flex-1">{issue.message}</span><button onClick={() => onFix(i)} className="text-xs text-blue-500">Fix</button></div>)}</div>)
}