'use client'
import React from 'react'
interface Props { title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: number }
// Feature 539: CollapsibleSection
export default function CollapsibleSection({ title, children, defaultOpen, badge }: Props) {
  const [open, setOpen] = React.useState(defaultOpen ?? true)
  return (<div className="border-b"><button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50"><span className="text-xs font-semibold text-gray-500 uppercase">{title}{badge !== undefined && <span className="ml-1 px-1 text-[10px] bg-gray-200 rounded">{badge}</span>}</span><span className="text-xs text-gray-400">{open?'-':'+'}</span></button>{open && <div>{children}</div>}</div>)
}