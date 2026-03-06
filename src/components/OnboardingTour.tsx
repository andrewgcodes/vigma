'use client'
interface Step { title: string; description: string }
interface Props { open: boolean; step: number; steps: Step[]; onNext: () => void; onPrev: () => void; onSkip: () => void }
export default function OnboardingTour({ open, step, steps, onNext, onPrev, onSkip }: Props) {
  if (!open || step >= steps.length) return null
  const s = steps[step]
  return (<div className="fixed inset-0 z-[9999]" onClick={onSkip}>
    <div className="absolute inset-0 bg-black/20" />
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[360px] bg-white rounded-xl shadow-2xl p-4" onClick={e => e.stopPropagation()}>
      <div className="text-xs text-gray-400 mb-1">Step {step+1} of {steps.length}</div>
      <div className="text-sm font-semibold mb-1">{s.title}</div>
      <div className="text-xs text-gray-600 mb-3">{s.description}</div>
      <div className="flex justify-between">
        <button onClick={onSkip} className="text-xs text-gray-400">Skip</button>
        <div className="flex gap-2">{step > 0 && <button onClick={onPrev} className="px-3 py-1 text-xs bg-gray-100 rounded">Back</button>}
        <button onClick={onNext} className="px-3 py-1 text-xs bg-blue-500 text-white rounded">{step===steps.length-1?'Finish':'Next'}</button></div>
      </div></div></div>)
}