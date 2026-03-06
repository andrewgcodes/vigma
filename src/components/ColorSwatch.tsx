'use client'
interface Props { colors: string[]; size?: string; onSelect: (color: string) => void; selected?: string }
// Feature 554: ColorSwatch
export default function ColorSwatch({ colors, size, onSelect, selected }: Props) {
  return (<div className="flex flex-wrap gap-1">{colors.map(c => <button key={c} onClick={() => onSelect(c)} className={'rounded border-2 transition-transform hover:scale-110 ' + (size==='lg'?'w-8 h-8':'w-5 h-5') + ' ' + (selected===c?'border-gray-800 scale-110':'border-transparent')} style={{background:c}} />)}</div>)
}