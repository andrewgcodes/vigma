'use client'
interface Props { variants: Array<{id:string;name:string}>; currentVariant: string; onSelect: (id: string) => void }
// Feature 490: VariantSelector
export default function VariantSelector({ variants, currentVariant, onSelect }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Variants</div><div className="flex flex-wrap gap-1">{variants.map(v => <button key={v.id} onClick={() => onSelect(v.id)} className={'px-2 py-1 text-xs rounded border ' + (currentVariant===v.id?'bg-blue-50 border-blue-300 text-blue-600':'')}>{v.name}</button>)}</div></div>)
}