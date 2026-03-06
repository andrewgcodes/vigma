'use client'
interface Props { width?: string; height?: string; rounded?: boolean; count?: number }
// Feature 531: Skeleton
export default function Skeleton({ width, height, rounded, count }: Props) {
  const items = Array.from({length: count || 1})
  return (<div className="space-y-2">{items.map((_,i) => <div key={i} className={'bg-gray-200 animate-pulse ' + (rounded?'rounded-full':'rounded')} style={{width:width||'100%',height:height||'16px'}} />)}</div>)
}