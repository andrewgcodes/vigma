'use client'
interface Props { guides: Array<{type:string;position:number;orientation:string}>; color: string }
// Feature 454: SmartGuideIndicator
export default function SmartGuideIndicator({ guides, color }: Props) {
  return (<div className="absolute inset-0 pointer-events-none z-[55]">{guides.map((g, i) => <div key={i} className="absolute" style={g.orientation==='horizontal'?{left:0,right:0,top:g.position,height:1,background:color}:{top:0,bottom:0,left:g.position,width:1,background:color}} />)}</div>)
}