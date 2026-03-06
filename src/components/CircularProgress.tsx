'use client'
interface Props { value: number; size?: number; strokeWidth?: number; color?: string }
// Feature 535: CircularProgress
export default function CircularProgress({ value, size, strokeWidth, color }: Props) {
  const sz = size || 32; const sw = strokeWidth || 3; const r = (sz-sw)/2; const c = 2*Math.PI*r; const offset = c*(1-value/100)
  return (<svg width={sz} height={sz} className="-rotate-90"><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} /><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color||'#3b82f6'} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" /></svg>)
}