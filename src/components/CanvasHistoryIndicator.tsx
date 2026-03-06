'use client'
interface Props { canUndo: boolean; canRedo: boolean; historyLength: number; currentIndex: number }
// Feature 458: CanvasHistoryIndicator
export default function CanvasHistoryIndicator({ canUndo, canRedo, historyLength, currentIndex }: Props) {
  return (<div className="flex items-center gap-1 text-xs text-gray-400"><span>{currentIndex}/{historyLength}</span>{canUndo && <span className="text-blue-400">Undo</span>}{canRedo && <span className="text-blue-400">Redo</span>}</div>)
}