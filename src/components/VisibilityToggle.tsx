'use client'
interface Props { visible: boolean; onChange: (v: boolean) => void; label?: string }
// Feature 571: VisibilityToggle
export default function VisibilityToggle({ visible, onChange, label }: Props) {
  return (<div className="flex items-center justify-between p-3 border-b"><span className="text-xs font-semibold text-gray-500 uppercase">{label||'Visibility'}</span><button onClick={() => onChange(!visible)} className={'px-2 py-0.5 text-xs rounded ' + (visible?'bg-green-100 text-green-600':'bg-gray-100 text-gray-400')}>{visible?'Visible':'Hidden'}</button></div>)
}