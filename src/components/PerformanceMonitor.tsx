'use client'
interface Props { visible: boolean; fps: number; memory: number; objectCount: number }
export default function PerformanceMonitor({ visible, fps, memory, objectCount }: Props) {
  if (!visible) return null
  return (<div className="fixed bottom-12 right-4 bg-black/80 text-green-400 font-mono text-xs px-3 py-2 rounded-lg z-[200] space-y-1">
    <div>FPS: {fps}</div>
    <div>Memory: {(memory / 1024 / 1024).toFixed(1)} MB</div>
    <div>Objects: {objectCount}</div>
  </div>)
}