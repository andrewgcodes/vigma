'use client'
interface Props { clipped: boolean; onToggle: () => void }
// Feature 484: FrameClipToggle
export default function FrameClipToggle({ clipped, onToggle }: Props) {
  return (<div className="flex items-center justify-between p-3 border-b"><span className="text-xs font-semibold text-gray-500 uppercase">Clip Content</span><button onClick={onToggle} className={'px-2 py-0.5 text-xs rounded ' + (clipped?'bg-blue-100 text-blue-600':'bg-gray-100')}>{clipped?'On':'Off'}</button></div>)
}