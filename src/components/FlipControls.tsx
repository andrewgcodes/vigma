'use client'
interface Props { onFlipH: () => void; onFlipV: () => void }
// Feature 475: FlipControls
export default function FlipControls({ onFlipH, onFlipV }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Flip</div><div className="flex gap-1"><button onClick={onFlipH} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">Horizontal</button><button onClick={onFlipV} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">Vertical</button></div></div>)
}