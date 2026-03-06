'use client'
interface Props { keyLabel: string; size?: string }
// Feature 532: KeyboardKey
export default function KeyboardKey({ keyLabel, size }: Props) {
  return (<kbd className={'inline-flex items-center justify-center bg-gray-100 border border-gray-300 rounded font-mono text-gray-600 shadow-sm ' + (size==='sm'?'px-1 py-0.5 text-[10px] min-w-[18px]':'px-1.5 py-0.5 text-xs min-w-[22px]')}>{keyLabel}</kbd>)
}