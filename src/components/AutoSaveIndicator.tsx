'use client'
interface Props { enabled: boolean; lastSaved: number | null; hasUnsaved: boolean; interval: number }
// Feature 438: AutoSaveIndicator
export default function AutoSaveIndicator({ enabled, lastSaved, hasUnsaved, interval }: Props) {
  return (<div className="flex items-center gap-2 text-xs text-gray-400"><div className={'w-2 h-2 rounded-full ' + (hasUnsaved?'bg-yellow-400':enabled?'bg-green-400':'bg-gray-300')} />{enabled ? (lastSaved ? <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span> : <span>Auto-save ({interval}s)</span>) : <span>Auto-save off</span>}</div>)
}