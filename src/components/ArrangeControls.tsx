'use client'
interface Props { onBringForward: () => void; onSendBackward: () => void; onBringToFront: () => void; onSendToBack: () => void }
// Feature 473: ArrangeControls
export default function ArrangeControls({ onBringForward, onSendBackward, onBringToFront, onSendToBack }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Arrange</div><div className="grid grid-cols-2 gap-1"><button onClick={onBringToFront} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">To Front</button><button onClick={onSendToBack} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">To Back</button><button onClick={onBringForward} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">Forward</button><button onClick={onSendBackward} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">Backward</button></div></div>)
}