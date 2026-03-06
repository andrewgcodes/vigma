'use client'
interface Props { active: boolean; onClick: () => void }
// Feature 464: ColorEyedropperButton
export default function ColorEyedropperButton({ active, onClick }: Props) {
  return (<button onClick={onClick} className={'px-3 py-1.5 text-xs rounded border flex items-center gap-1 ' + (active?'bg-blue-50 border-blue-300 text-blue-600':'border-gray-200 hover:bg-gray-50')}>Eyedropper{active && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}</button>)
}