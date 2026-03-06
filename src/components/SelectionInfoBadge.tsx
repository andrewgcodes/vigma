'use client'

import React from 'react'

// Feature 80: Selection Info Badge - shows count and type of selected objects
interface SelectionInfoBadgeProps {
  count: number
  type: string
  visible: boolean
}

export default function SelectionInfoBadge({ count, type, visible }: SelectionInfoBadgeProps) {
  if (!visible || count === 0) return null

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="bg-gray-900/80 text-white text-[11px] rounded-full px-3 py-1 shadow-lg backdrop-blur-sm">
        {count === 1 ? type : `${count} objects selected`}
      </div>
    </div>
  )
}
