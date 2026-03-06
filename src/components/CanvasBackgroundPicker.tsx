'use client'

import React from 'react'
import { X, Paintbrush } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'

// Feature 79: Canvas Background Color Picker
interface CanvasBackgroundPickerProps {
  open: boolean
  onClose: () => void
  color: string
  onChange: (color: string) => void
}

const presetBackgrounds = [
  '#ffffff', '#f5f5f7', '#fafafa', '#f0f0f0',
  '#e8e8e8', '#1d1d1f', '#2c2c2e', '#000000',
  '#f0f4ff', '#fff0f0', '#f0fff0', '#fffff0',
]

export default function CanvasBackgroundPicker({ open, onClose, color, onChange }: CanvasBackgroundPickerProps) {
  if (!open) return null

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9998] bg-white rounded-2xl shadow-2xl border border-canvas-border w-64 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border">
        <div className="flex items-center gap-2">
          <Paintbrush size={16} className="text-canvas-accent" />
          <h3 className="text-sm font-semibold text-canvas-text">Canvas Background</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />
        <div>
          <span className="text-xxs text-canvas-text-tertiary mb-1.5 block">Presets</span>
          <div className="flex flex-wrap gap-1.5">
            {presetBackgrounds.map(c => (
              <button
                key={c}
                onClick={() => onChange(c)}
                className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 ${
                  color === c ? 'border-canvas-accent ring-1 ring-canvas-accent' : 'border-canvas-border'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xxs text-canvas-text-tertiary">Hex:</span>
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 text-xs px-2 py-1 border border-canvas-border rounded-lg bg-canvas-bg text-canvas-text"
          />
        </div>
      </div>
    </div>
  )
}
