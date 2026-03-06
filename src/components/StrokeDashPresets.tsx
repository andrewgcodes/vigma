'use client'

import React from 'react'

// Feature 83: Stroke Dash Presets - quick dash pattern selection
interface StrokeDashPresetsProps {
  currentDash: number[]
  onDashChange: (dash: number[]) => void
}

const dashPresets = [
  { label: 'Solid', dash: [] },
  { label: 'Dotted', dash: [2, 4] },
  { label: 'Dashed', dash: [8, 4] },
  { label: 'Long Dash', dash: [16, 4] },
  { label: 'Dash Dot', dash: [8, 4, 2, 4] },
  { label: 'Long Dash Dot', dash: [16, 4, 2, 4] },
]

export default function StrokeDashPresets({ currentDash, onDashChange }: StrokeDashPresetsProps) {
  const isMatch = (a: number[], b: number[]) => JSON.stringify(a) === JSON.stringify(b)

  return (
    <div className="space-y-1">
      <span className="text-xxs text-canvas-text-tertiary block">Dash Pattern</span>
      <div className="flex flex-wrap gap-1">
        {dashPresets.map(p => (
          <button
            key={p.label}
            onClick={() => onDashChange(p.dash)}
            className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
              isMatch(currentDash, p.dash)
                ? 'bg-canvas-accent text-white border-canvas-accent'
                : 'bg-white text-canvas-text-secondary border-canvas-border hover:bg-canvas-hover'
            }`}
            title={p.label}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
