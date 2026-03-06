'use client'
import React from 'react'
interface Props { title: string; children: React.ReactNode; defaultOpen?: boolean }
// Feature 525: Accordion
export default function Accordion({ title, children, defaultOpen }: Props) {
  const [open, setOpen] = React.useState(defaultOpen ?? false)
  return (<div className="border-b"><button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase hover:bg-gray-50"><span>{title}</span><span className={'transform transition-transform ' + (open?'rotate-180':'')}>&darr;</span></button>{open && <div>{children}</div>}</div>)
}