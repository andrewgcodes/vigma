'use client'
interface Props { title: string; subtitle?: string; actions?: React.ReactNode }
// Feature 541: StickyHeader
export default function StickyHeader({ title, subtitle, actions }: Props) {
  return (<div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-3 py-2 flex items-center justify-between"><div><div className="text-sm font-semibold">{title}</div>{subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}</div>{actions && <div className="flex gap-1">{actions}</div>}</div>)
}