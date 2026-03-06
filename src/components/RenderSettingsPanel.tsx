'use client'
interface Props { quality: string; onQualityChange: (q: string) => void; antiAliasing: boolean; onToggleAntiAliasing: () => void }
export default function RenderSettingsPanel({ quality, onQualityChange, antiAliasing, onToggleAntiAliasing }: Props) {
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Render Settings</div>
    <div className="flex items-center justify-between mb-2"><span className="text-xs">Quality</span><select value={quality} onChange={e => onQualityChange(e.target.value)} className="text-xs border rounded px-2 py-1"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
    <div className="flex items-center justify-between"><span className="text-xs">Anti-aliasing</span><button onClick={onToggleAntiAliasing} className={'px-2 py-0.5 text-xs rounded ' + (antiAliasing?'bg-blue-100 text-blue-600':'bg-gray-100')}>{antiAliasing?'On':'Off'}</button></div>
  </div>)
}