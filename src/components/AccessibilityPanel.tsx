'use client'
interface Props { highContrast: boolean; onToggleHighContrast: () => void; reducedMotion: boolean; onToggleReducedMotion: () => void; screenReaderText: string }
export default function AccessibilityPanel({ highContrast, onToggleHighContrast, reducedMotion, onToggleReducedMotion, screenReaderText }: Props) {
  return (<div className="p-3 border-b">
    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Accessibility</div>
    <div className="flex items-center justify-between mb-2"><span className="text-xs">High Contrast</span><button onClick={onToggleHighContrast} className={'px-2 py-0.5 text-xs rounded ' + (highContrast?'bg-blue-100 text-blue-600':'bg-gray-100')}>{highContrast?'On':'Off'}</button></div>
    <div className="flex items-center justify-between mb-2"><span className="text-xs">Reduced Motion</span><button onClick={onToggleReducedMotion} className={'px-2 py-0.5 text-xs rounded ' + (reducedMotion?'bg-blue-100 text-blue-600':'bg-gray-100')}>{reducedMotion?'On':'Off'}</button></div>
    {screenReaderText && <div className="sr-only" role="status" aria-live="polite">{screenReaderText}</div>}
  </div>)
}