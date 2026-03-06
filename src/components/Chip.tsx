'use client'
interface Props { label: string; onDelete?: () => void; color?: string; selected?: boolean; onClick?: () => void }
// Feature 530: Chip
export default function Chip({ label, onDelete, color, selected, onClick }: Props) {
  return (<button onClick={onClick} className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ' + (selected?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-200 hover:bg-gray-50')} style={color?{borderColor:color,color:color}:{}}>{label}{onDelete && <span onClick={e => {e.stopPropagation();onDelete()}} className="text-gray-400 hover:text-gray-600 cursor-pointer">&times;</span>}</button>)
}