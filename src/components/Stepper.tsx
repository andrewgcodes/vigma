'use client'
interface Props { steps: string[]; currentStep: number; onStepClick: (step: number) => void }
// Feature 537: Stepper
export default function Stepper({ steps, currentStep, onStepClick }: Props) {
  return (<div className="flex items-center gap-2">{steps.map((s,i) => <div key={i} className="flex items-center gap-2"><button onClick={() => onStepClick(i)} className={'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ' + (i<=currentStep?'bg-blue-500 text-white':'bg-gray-200 text-gray-500')}>{i+1}</button><span className={'text-xs ' + (i===currentStep?'font-medium':i<currentStep?'text-blue-500':'text-gray-400')}>{s}</span>{i<steps.length-1 && <div className={'w-8 h-0.5 ' + (i<currentStep?'bg-blue-500':'bg-gray-200')} />}</div>)}</div>)
}