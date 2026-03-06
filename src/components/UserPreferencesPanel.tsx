'use client'
interface Props { preferences: Record<string,boolean>; onToggle: (key: string) => void; descriptions: Record<string,string> }
// Feature 580: UserPreferencesPanel
export default function UserPreferencesPanel({ preferences, onToggle, descriptions }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Preferences</div>{Object.entries(preferences).map(([key,val]) => <div key={key} className="flex items-center justify-between py-1.5 border-b"><div><div className="text-xs capitalize">{key.replace(/([A-Z])/g,' $1')}</div>{descriptions[key] && <div className="text-[10px] text-gray-400">{descriptions[key]}</div>}</div><button onClick={() => onToggle(key)} className={'px-2 py-0.5 text-xs rounded ' + (val?'bg-blue-100 text-blue-600':'bg-gray-100')}>{val?'On':'Off'}</button></div>)}</div>)
}