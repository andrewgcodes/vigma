'use client'
interface Props { colors: string[]; onSelect: (c: string) => void; columns?: number }
// Feature 597: QuickColorPalette
export default function QuickColorPalette({ colors, onSelect, columns }: Props) {
  return (<div className="grid gap-0.5" style={{gridTemplateColumns:'repeat('+(columns||8)+',1fr)'}}>{colors.map(c => <button key={c} onClick={() => onSelect(c)} className="aspect-square rounded-sm border border-gray-200 hover:scale-110 transition-transform" style={{background:c}} />)}</div>)
}