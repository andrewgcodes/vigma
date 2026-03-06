'use client'
interface Props { theme: string; onThemeChange: (t: string) => void; accentColor: string; onAccentChange: (c: string) => void }
export default function ThemeSelector({ theme, onThemeChange, accentColor, onAccentChange }: Props) {
  const themes = [{id:'light',label:'Light',bg:'#fff',fg:'#000'},{id:'dark',label:'Dark',bg:'#1a1a2e',fg:'#fff'},{id:'system',label:'System',bg:'#f0f0f0',fg:'#333'}]
  const accents = ['#007AFF','#FF3B30','#34C759','#FF9500','#AF52DE','#5856D6','#FF2D55','#00C7BE']
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Theme</div>
    <div className="flex gap-2 mb-3">{themes.map(t => <button key={t.id} onClick={() => onThemeChange(t.id)} className={'flex-1 p-2 rounded border text-xs text-center ' + (theme===t.id?'border-blue-400 bg-blue-50':'')} style={{background:t.bg,color:t.fg}}>{t.label}</button>)}</div>
    <div className="text-xs text-gray-500 mb-1">Accent Color</div>
    <div className="flex gap-1">{accents.map(c => <button key={c} onClick={() => onAccentChange(c)} className={'w-6 h-6 rounded-full border-2 ' + (accentColor===c?'border-gray-800':'border-transparent')} style={{background:c}} />)}</div>
  </div>)
}