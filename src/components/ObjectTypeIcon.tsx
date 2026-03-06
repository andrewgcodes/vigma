'use client'
interface Props { type: string; size?: string }
// Feature 595: ObjectTypeIcon
export default function ObjectTypeIcon({ type, size }: Props) {
  const icons: Record<string,string> = {rect:'R',ellipse:'O',text:'T',image:'I',path:'P',group:'G',frame:'F',line:'L'}
  return (<span className={'inline-flex items-center justify-center bg-gray-100 rounded text-gray-500 font-mono font-bold ' + (size==='lg'?'w-8 h-8 text-sm':'w-5 h-5 text-[10px]')}>{icons[type]||'?'}</span>)
}