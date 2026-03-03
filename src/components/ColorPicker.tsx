'use client'

import React, { useState, useCallback } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  label?: string
}

const presetColors = [
  '#1d1d1f', '#6e6e73', '#86868b', '#d2d2d7', '#f5f5f7', '#ffffff',
  '#ff3b30', '#ff6b6b', '#ff9500', '#ffcc00', '#34c759', '#30d158',
  '#00c7be', '#32ade6', '#007aff', '#5856d6', '#af52de', '#ff2d55',
  '#0071e3', '#4A90D9', '#50C878', '#FFD700', '#E86C6C', '#9B59B6',
]

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetClick = useCallback((preset: string) => {
    onChange(preset)
  }, [onChange])

  return (
    <div className="relative">
      {label && (
        <label className="text-xs text-canvas-text-secondary mb-1 block">{label}</label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border border-canvas-border hover:border-canvas-text-tertiary transition-colors"
      >
        <div
          className="w-5 h-5 rounded-md border border-canvas-border shadow-sm"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-mono text-canvas-text uppercase">{color}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-panel-lg p-3 w-56">
            <HexColorPicker color={color} onChange={onChange} />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-canvas-text-secondary">#</span>
              <HexColorInput
                color={color}
                onChange={onChange}
                className="w-full text-xs font-mono bg-canvas-bg rounded-lg px-2 py-1.5 border border-canvas-border focus:outline-none focus:border-canvas-accent uppercase"
              />
            </div>
            <div className="mt-2 grid grid-cols-6 gap-1">
              {presetColors.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`w-7 h-7 rounded-md border transition-transform hover:scale-110 ${
                    color === preset ? 'border-canvas-accent ring-1 ring-canvas-accent' : 'border-canvas-border'
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
