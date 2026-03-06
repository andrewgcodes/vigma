'use client'

import React from 'react'

// Feature 82: Font Size Presets - quick font size selection
interface FontSizePresetsProps {
  currentSize: number
  onSizeChange: (size: number) => void
}

const presets = [
  { label: 'H1', size: 48 },
  { label: 'H2', size: 36 },
  { label: 'H3', size: 24 },
  { label: 'H4', size: 20 },
  { label: 'Body', size: 16 },
  { label: 'Small', size: 14 },
  { label: 'XS', size: 12 },
  { label: 'XXS', size: 10 },
]

export default function FontSizePresets({ currentSize, onSizeChange }: FontSizePresetsProps) {
  return (
    <div className="px-4 py-2 border-b border-canvas-border">
      <span className="text-xxs text-canvas-text-tertiary mb-1.5 block">Size Presets</span>
      <div className="flex flex-wrap gap-1">
        {presets.map(p => (
          <button
            key={p.label}
            onClick={() => onSizeChange(p.size)}
            className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
              currentSize === p.size
                ? 'bg-canvas-accent text-white border-canvas-accent'
                : 'bg-white text-canvas-text-secondary border-canvas-border hover:bg-canvas-hover'
            }`}
            title={`${p.size}px`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
