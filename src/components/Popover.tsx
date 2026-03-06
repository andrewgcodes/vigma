'use client'
interface Props { trigger: React.ReactNode; content: React.ReactNode; open: boolean; onToggle: () => void; position?: string }
// Feature 547: Popover
export default function Popover({ trigger, content, open, onToggle, position }: Props) {
  return (<div className="relative inline-block"><div onClick={onToggle}>{trigger}</div>{open && <><div className="fixed inset-0 z-[199]" onClick={onToggle} /><div className={'absolute z-[200] bg-white rounded-lg shadow-xl border p-3 ' + (position==='top'?'bottom-full mb-2':'top-full mt-2')}>{content}</div></>}</div>)
}