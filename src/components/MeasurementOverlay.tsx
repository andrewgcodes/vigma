'use client'
interface Props { visible: boolean; measurements: Array<{label:string;value:number;unit:string;x:number;y:number}> }
// Feature 453: MeasurementOverlay
export default function MeasurementOverlay({ visible, measurements }: Props) {
  if (!visible) return null
  return (<div className="absolute inset-0 pointer-events-none z-[60]">{measurements.map((m, i) => <div key={i} className="absolute bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap" style={{left:m.x,top:m.y}}>{m.label}: {m.value}{m.unit}</div>)}</div>)
}