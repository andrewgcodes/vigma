'use client'
interface Props { text: string; children: React.ReactNode; position?: string }
// Feature 516: ToolTip
export default function ToolTip({ text, children, position }: Props) {
  return (<div className="relative inline-block group">{children}<div className={'absolute hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-[999] ' + (position==='top'?'bottom-full left-1/2 -translate-x-1/2 mb-1':position==='left'?'right-full top-1/2 -translate-y-1/2 mr-1':position==='right'?'left-full top-1/2 -translate-y-1/2 ml-1':'top-full left-1/2 -translate-x-1/2 mt-1')}>{text}</div></div>)
}