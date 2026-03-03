'use client'

import React from 'react'

interface ZoomIndicatorProps {
  zoom: number
}

export default function ZoomIndicator({ zoom }: ZoomIndicatorProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-panel px-3 py-1.5 text-xs font-medium text-canvas-text-secondary">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}
