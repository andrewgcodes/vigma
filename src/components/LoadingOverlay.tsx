'use client'
interface Props { visible: boolean; message: string; progress?: number }
// Feature 509: LoadingOverlay
export default function LoadingOverlay({ visible, message, progress }: Props) {
  if (!visible) return null
  return (<div className="fixed inset-0 z-[99999] bg-white/80 flex flex-col items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" /><div className="text-sm text-gray-600">{message}</div>{progress !== undefined && <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-2"><div className="h-full bg-blue-500 rounded-full" style={{width:progress+'%'}} /></div>}</div>)
}