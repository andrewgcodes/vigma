'use client'
interface Props { overrides: Array<{property:string;value:string;isOverridden:boolean}>; onReset: (property: string) => void }
// Feature 489: ComponentOverridesPanel
export default function ComponentOverridesPanel({ overrides, onReset }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Component Overrides</div>{overrides.map(o => <div key={o.property} className={'flex items-center justify-between py-1 ' + (o.isOverridden?'':'opacity-50')}><span className="text-xs">{o.property}: {o.value}</span>{o.isOverridden && <button onClick={() => onReset(o.property)} className="text-xs text-blue-500">Reset</button>}</div>)}</div>)
}