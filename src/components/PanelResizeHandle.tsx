'use client'
interface Props { orientation: string; onResize: (delta: number) => void }
// Feature 538: PanelResizeHandle
export default function PanelResizeHandle({ orientation, onResize }: Props) {
  return (<div className={'flex-shrink-0 bg-transparent hover:bg-blue-200 transition-colors ' + (orientation==='horizontal'?'w-1 cursor-col-resize':'h-1 cursor-row-resize')} onMouseDown={e => {const start = orientation==='horizontal'?e.clientX:e.clientY;const move = (ev: MouseEvent) => onResize((orientation==='horizontal'?ev.clientX:ev.clientY)-start);const up = () => {window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up)};window.addEventListener('mousemove',move);window.addEventListener('mouseup',up)}} />)
}