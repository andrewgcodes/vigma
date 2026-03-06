'use client'
interface Props { mode: string; onChange: (m: string) => void }
// Feature 573: MixBlendModeSelector
export default function MixBlendModeSelector({ mode, onChange }: Props) {
  const modes = ['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion']
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Mix Blend Mode</div><select value={mode} onChange={e => onChange(e.target.value)} className="w-full text-xs border rounded px-2 py-1">{modes.map(m => <option key={m} value={m}>{m}</option>)}</select></div>)
}