'use client'

import React from 'react'

// Feature 76: Object Info Overlay - shows dimensions/position of selected object
interface ObjectInfoOverlayProps {
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  rotation: number
  type: string
  name: string
}

export default function ObjectInfoOverlay({ visible, x, y, width, height, rotation, type, name }: ObjectInfoOverlayProps) {
  if (!visible) return null

  return (
    <div
      className="fixed z-40 pointer-events-none"
      style={{ left: x + 10, top: y - 50 }}
    >
      <div className="bg-gray-900/90 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-lg backdrop-blur-sm whitespace-nowrap">
        <div className="font-medium text-[11px] mb-0.5">{name || type}</div>
        <div className="text-gray-300">
          {Math.round(width)} x {Math.round(height)} {rotation ? `  ${Math.round(rotation)}deg` : ''}
        </div>
      </div>
    </div>
  )
}
