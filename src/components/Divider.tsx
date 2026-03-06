'use client'
interface Props { label?: string; vertical?: boolean }
// Feature 526: Divider
export default function Divider({ label, vertical }: Props) {
  if (vertical) return <div className="w-px bg-gray-200 mx-1 self-stretch" />
  if (label) return <div className="flex items-center gap-2 py-2"><div className="flex-1 h-px bg-gray-200" /><span className="text-[10px] text-gray-400">{label}</span><div className="flex-1 h-px bg-gray-200" /></div>
  return <div className="h-px bg-gray-200 my-1" />
}