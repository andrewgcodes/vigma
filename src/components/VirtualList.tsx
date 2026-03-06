'use client'
import React from 'react'
interface Props { itemCount: number; itemHeight: number; visibleCount: number; renderItem: (index: number) => React.ReactNode }
// Feature 544: VirtualList
export default function VirtualList({ itemCount, itemHeight, visibleCount, renderItem }: Props) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleCount + 1, itemCount)
  return (<div style={{height:visibleCount*itemHeight,overflow:'auto'}} onScroll={e => setScrollTop((e.target as HTMLElement).scrollTop)}><div style={{height:itemCount*itemHeight,position:'relative'}}>{Array.from({length:endIndex-startIndex}).map((_,i) => <div key={startIndex+i} style={{position:'absolute',top:(startIndex+i)*itemHeight,height:itemHeight,left:0,right:0}}>{renderItem(startIndex+i)}</div>)}</div></div>)
}