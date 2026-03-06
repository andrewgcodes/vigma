'use client'
interface Props { visible: boolean; size: number; color?: string }
export default function BaselineGridOverlay({ visible, size, color = 'rgba(0,0,255,0.06)' }: Props) {
  if (!visible) return null
  return (<div className="absolute inset-0 pointer-events-none z-[49]" style={{backgroundImage: 'repeating-linear-gradient(0deg, ' + color + ' 0px, ' + color + ' 1px, transparent 1px, transparent ' + size + 'px)', backgroundSize: '100% ' + size + 'px'}} />)
}