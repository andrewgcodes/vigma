'use client'
interface Props { visible: boolean; columns: number; gutter: number; margin: number; canvasWidth: number; color?: string }
export default function LayoutGridOverlay({ visible, columns, gutter, margin, canvasWidth, color = 'rgba(255,0,0,0.08)' }: Props) {
  if (!visible) return null
  const totalGutter = (columns - 1) * gutter
  const colWidth = (canvasWidth - 2 * margin - totalGutter) / columns
  return (<div className="absolute inset-0 pointer-events-none z-[50]" style={{left: margin, right: margin}}>
    <div className="h-full flex" style={{gap: gutter}}>
      {Array.from({length: columns}).map((_, i) => <div key={i} style={{width: colWidth, background: color}} className="h-full" />)}
    </div>
  </div>)
}