'use client'
interface Props { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }
// Feature 584: UndoRedoButtons
export default function UndoRedoButtons({ canUndo, canRedo, onUndo, onRedo }: Props) {
  return (<div className="flex gap-1"><button onClick={onUndo} disabled={!canUndo} className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-40">Undo</button><button onClick={onRedo} disabled={!canRedo} className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-40">Redo</button></div>)
}