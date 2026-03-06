'use client'
interface Props { text: string; color?: string; variant?: string }
// Feature 517: Badge
export default function Badge({ text, color, variant }: Props) {
  return (<span className={'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ' + (variant==='outline'?'border ' + (color?'border-current':'border-gray-300 text-gray-500'):(color||'bg-blue-100 text-blue-700'))}>{text}</span>)
}