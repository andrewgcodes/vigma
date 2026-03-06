'use client'

import React from 'react'
import { useDesignStore } from '@/store/useDesignStore'

// Feature 74: Quick Color Swatches - shows recent colors for fast access
interface QuickColorSwatchesProps {
  onColorSelect: (color: string) => void
}

export default function QuickColorSwatches({ onColorSelect }: QuickColorSwatchesProps) {
  const { recentColors } = useDesignStore()

  if (recentColors.length === 0) return null

  return (
    <div className="px-4 py-2 border-b border-canvas-border">
      <span className="text-xxs text-canvas-text-tertiary mb-1.5 block">Recent colors</span>
      <div className="flex flex-wrap gap-1">
        {recentColors.map((color, i) => (
          <button
            key={`${color}-${i}`}
            onClick={() => onColorSelect(color)}
            className="w-5 h-5 rounded border border-canvas-border hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
