'use client'
interface GradientStop { offset: number; color: string }
interface Props { open: boolean; onClose: () => void; stops: GradientStop[]; angle: number; onStopsChange: (s: GradientStop[]) => void; onAngleChange: (a: number) => void; onApply: () => void }
// Feature 404: Gradient Editor
export default function GradientEditor({ open, onClose, stops, angle, onStopsChange, onAngleChange, onApply }: Props) {
  if (!open) return null
  const grad = 'linear-gradient(' + angle + 'deg, ' + stops.map(s => s.color + ' ' + (s.offset*100) + '%').join(', ') + ')'
  return (<div className="fixed right-4 top-20 z-[200] w-[280px] bg-white rounded-lg shadow-xl border p-3">
    <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">Gradient Editor</span><button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button></div>
    <div className="w-full h-16 rounded mb-2 border" style={{ background: grad }} />
    <div className="mb-2"><label className="text-xs text-gray-500">Angle: {angle} deg</label><input type="range" min={0} max={360} value={angle} onChange={e => onAngleChange(Number(e.target.value))} className="w-full" /></div>
    {stops.map((s, i) => <div key={i} className="flex items-center gap-2 mb-1"><input type="color" value={s.color} onChange={e => { const ns=[...stops]; ns[i]={...s,color:e.target.value}; onStopsChange(ns) }} className="w-6 h-6" /><input type="range" min={0} max={100} value={s.offset*100} onChange={e => { const ns=[...stops]; ns[i]={...s,offset:Number(e.target.value)/100}; onStopsChange(ns) }} className="flex-1" /><span className="text-xs w-8">{Math.round(s.offset*100)}%</span></div>)}
    <div className="flex gap-1 mt-2"><button onClick={() => onStopsChange([...stops, {offset:0.5,color:'#888888'}])} className="flex-1 text-xs px-2 py-1 bg-gray-100 rounded">Add Stop</button><button onClick={onApply} className="flex-1 text-xs px-2 py-1 bg-blue-500 text-white rounded">Apply</button></div>
  </div>)
}