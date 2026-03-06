'use client'
const BLEND_MODES = ['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity']
interface Props { value: string; onChange: (mode: string) => void }
export default function BlendModeSelector({ value, onChange }: Props) {
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Blend Mode</div>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full text-xs border rounded px-2 py-1.5 capitalize">{BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}</select>
  </div>)
}