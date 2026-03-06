'use client'

import React from 'react'

// Feature 84: Shadow Presets - quick shadow application
interface ShadowPresetsProps {
  onApply: (shadow: { color: string; blur: number; offsetX: number; offsetY: number }) => void
  onRemove: () => void
}

const shadowPresets = [
  { label: 'None', shadow: null },
  { label: 'Subtle', shadow: { color: 'rgba(0,0,0,0.1)', blur: 4, offsetX: 0, offsetY: 2 } },
  { label: 'Small', shadow: { color: 'rgba(0,0,0,0.15)', blur: 8, offsetX: 0, offsetY: 4 } },
  { label: 'Medium', shadow: { color: 'rgba(0,0,0,0.2)', blur: 16, offsetX: 0, offsetY: 8 } },
  { label: 'Large', shadow: { color: 'rgba(0,0,0,0.25)', blur: 24, offsetX: 0, offsetY: 12 } },
  { label: 'XL', shadow: { color: 'rgba(0,0,0,0.3)', blur: 40, offsetX: 0, offsetY: 20 } },
  { label: 'Glow', shadow: { color: 'rgba(59,130,246,0.5)', blur: 20, offsetX: 0, offsetY: 0 } },
  { label: 'Hard', shadow: { color: 'rgba(0,0,0,0.3)', blur: 0, offsetX: 4, offsetY: 4 } },
]

export default function ShadowPresets({ onApply, onRemove }: ShadowPresetsProps) {
  return (
    <div className="space-y-1">
      <span className="text-xxs text-canvas-text-tertiary block">Shadow Presets</span>
      <div className="flex flex-wrap gap-1">
        {shadowPresets.map(p => (
          <button
            key={p.label}
            onClick={() => p.shadow ? onApply(p.shadow) : onRemove()}
            className="px-2 py-0.5 text-[10px] rounded border border-canvas-border bg-white text-canvas-text-secondary hover:bg-canvas-hover transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
