'use client'
interface Props { tolerance: number; onToleranceChange: (t: number) => void; alignGuides: boolean; onToggleAlignGuides: () => void; smartSpacing: boolean; onToggleSmartSpacing: () => void; guideColor: string; onGuideColorChange: (c: string) => void }
export default function SnapSettingsPanel({ tolerance, onToleranceChange, alignGuides, onToggleAlignGuides, smartSpacing, onToggleSmartSpacing, guideColor, onGuideColorChange }: Props) {
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Snap Settings</div>
    <div className="flex items-center justify-between mb-2"><span className="text-xs">Tolerance</span><input type="number" value={tolerance} onChange={e => onToleranceChange(Number(e.target.value))} className="w-16 text-xs border rounded px-2 py-1" /></div>
    <div className="flex items-center justify-between mb-2"><span className="text-xs">Alignment Guides</span><button onClick={onToggleAlignGuides} className={'px-2 py-0.5 text-xs rounded ' + (alignGuides?'bg-blue-100 text-blue-600':'bg-gray-100')}>{alignGuides?'On':'Off'}</button></div>
    <div className="flex items-center justify-between mb-2"><span className="text-xs">Smart Spacing</span><button onClick={onToggleSmartSpacing} className={'px-2 py-0.5 text-xs rounded ' + (smartSpacing?'bg-blue-100 text-blue-600':'bg-gray-100')}>{smartSpacing?'On':'Off'}</button></div>
    <div className="flex items-center justify-between"><span className="text-xs">Guide Color</span><input type="color" value={guideColor} onChange={e => onGuideColorChange(e.target.value)} className="w-6 h-6" /></div>
  </div>)
}