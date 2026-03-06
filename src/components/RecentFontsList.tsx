'use client'
interface Props { fonts: string[]; onSelect: (font: string) => void }
// Feature 447: RecentFontsList
export default function RecentFontsList({ fonts, onSelect }: Props) {
  if (fonts.length === 0) return null
  return (<div className="p-2 border-b"><div className="text-xs text-gray-400 mb-1">Recent Fonts</div><div className="flex flex-wrap gap-1">{fonts.map(f => <button key={f} onClick={() => onSelect(f)} className="px-2 py-0.5 text-xs bg-gray-50 rounded hover:bg-gray-100" style={{fontFamily:f}}>{f}</button>)}</div></div>)
}