'use client'
interface Props { ratio: string; children: React.ReactNode; bgColor?: string }
// Feature 543: AspectRatioBox
export default function AspectRatioBox({ ratio, children, bgColor }: Props) {
  const [w,h] = ratio.split(':').map(Number)
  return (<div className="relative w-full" style={{paddingBottom:(h/w*100)+'%',background:bgColor||'transparent'}}><div className="absolute inset-0">{children}</div></div>)
}