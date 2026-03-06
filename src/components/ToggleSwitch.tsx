'use client'
interface Props { checked: boolean; onChange: (checked: boolean) => void; label?: string; size?: string }
// Feature 519: ToggleSwitch
export default function ToggleSwitch({ checked, onChange, label, size }: Props) {
  const s = size === 'sm' ? 'w-8 h-4' : 'w-10 h-5'
  const dot = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (<label className="flex items-center gap-2 cursor-pointer">{label && <span className="text-xs text-gray-600">{label}</span>}<div onClick={() => onChange(!checked)} className={'relative rounded-full transition-colors ' + s + ' ' + (checked?'bg-blue-500':'bg-gray-300')}><div className={'absolute top-0.5 left-0.5 rounded-full bg-white transition-transform ' + dot + ' ' + (checked?'translate-x-full':'')} /></div></label>)
}