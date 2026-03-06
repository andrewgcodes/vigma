'use client'
interface Props { foreground: string; background: string }
// Feature 441: ColorContrastChecker
export default function ColorContrastChecker({ foreground, background }: Props) {
  const lum = (hex: string) => { const r = parseInt(hex.slice(1,3),16)/255; const g = parseInt(hex.slice(3,5),16)/255; const b = parseInt(hex.slice(5,7),16)/255; const adj = (c: number) => c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); return 0.2126*adj(r)+0.7152*adj(g)+0.0722*adj(b) }
  const l1 = lum(foreground); const l2 = lum(background); const ratio = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)
  const aa = ratio >= 4.5; const aaa = ratio >= 7
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Contrast</div><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded border" style={{background:foreground}} /><span className="text-xs">on</span><div className="w-8 h-8 rounded border" style={{background:background}} /></div><div className="text-lg font-bold mb-1">{ratio.toFixed(2)}:1</div><div className="flex gap-2"><span className={'text-xs px-2 py-0.5 rounded ' + (aa?'bg-green-100 text-green-700':'bg-red-100 text-red-700')}>AA {aa?'Pass':'Fail'}</span><span className={'text-xs px-2 py-0.5 rounded ' + (aaa?'bg-green-100 text-green-700':'bg-red-100 text-red-700')}>AAA {aaa?'Pass':'Fail'}</span></div></div>)
}