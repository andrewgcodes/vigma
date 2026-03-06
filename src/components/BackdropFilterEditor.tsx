'use client'
interface Props { blur: number; brightness: number; contrast: number; onBlurChange: (v: number) => void; onBrightnessChange: (v: number) => void; onContrastChange: (v: number) => void }
// Feature 574: BackdropFilterEditor
export default function BackdropFilterEditor({ blur, brightness, contrast, onBlurChange, onBrightnessChange, onContrastChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Backdrop Filter</div>{[{l:'Blur',v:blur,fn:onBlurChange,max:30},{l:'Brightness',v:brightness,fn:onBrightnessChange,max:200},{l:'Contrast',v:contrast,fn:onContrastChange,max:200}].map(f => <div key={f.l} className="flex items-center gap-2 mb-1"><span className="text-xs w-16 text-gray-400">{f.l}</span><input type="range" min={0} max={f.max} value={f.v} onChange={e => f.fn(Number(e.target.value))} className="flex-1" /><span className="text-xs w-8 text-right">{f.v}</span></div>)}</div>)
}