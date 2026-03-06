'use client'

import React from 'react'

// Feature 85: Opacity Presets - quick opacity selection
interface OpacityPresetsProps {
  currentOpacity: number
  onOpacityChange: (opacity: number) => void
}

const presets = [100, 90, 75, 50, 25, 10, 0]

export default function OpacityPresets({ currentOpacity, onOpacityChange }: OpacityPresetsProps) {
  return (
    <div className="space-y-1">
      <span className="text-xxs text-canvas-text-tertiary block">Opacity Presets</span>
      <div className="flex flex-wrap gap-1">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onOpacityChange(p)}
            className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
              currentOpacity === p
                ? 'bg-canvas-accent text-white border-canvas-accent'
                : 'bg-white text-canvas-text-secondary border-canvas-border hover:bg-canvas-hover'
            }`}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  )
}
