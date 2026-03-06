'use client'
interface Props { tabs: Array<{id:string;label:string}>; activeTab: string; onTabChange: (id: string) => void }
// Feature 513: TabBar
export default function TabBar({ tabs, activeTab, onTabChange }: Props) {
  return (<div className="flex border-b">{tabs.map(t => <button key={t.id} onClick={() => onTabChange(t.id)} className={'px-3 py-2 text-xs border-b-2 ' + (activeTab===t.id?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700')}>{t.label}</button>)}</div>)
}