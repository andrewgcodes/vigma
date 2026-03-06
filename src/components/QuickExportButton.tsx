'use client'
interface Props { format: string; onExport: () => void; loading: boolean }
// Feature 594: QuickExportButton
export default function QuickExportButton({ format, onExport, loading }: Props) {
  return (<button onClick={onExport} disabled={loading} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60 flex items-center gap-1">{loading?<span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />:null}Export {format.toUpperCase()}</button>)
}