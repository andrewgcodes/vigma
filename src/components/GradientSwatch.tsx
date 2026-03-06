'use client'
interface Props { gradient: string; onClick?: () => void; selected?: boolean; label?: string }
// Feature 556: GradientSwatch
export default function GradientSwatch({ gradient, onClick, selected, label }: Props) {
  return (<button onClick={onClick} className={'p-1 rounded border-2 ' + (selected?'border-blue-400':'border-transparent hover:border-gray-300')}><div className="w-full h-8 rounded" style={{background:gradient}} />{label && <div className="text-[10px] text-gray-400 mt-0.5 text-center">{label}</div>}</button>)
}