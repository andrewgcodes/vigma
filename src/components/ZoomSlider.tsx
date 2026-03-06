'use client'

import React from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'

// Feature 81: Zoom Slider - continuous zoom control
interface ZoomSliderProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export default function ZoomSlider({ zoom, onZoomChange, onZoomIn, onZoomOut }: ZoomSliderProps) {
  const percentage = Math.round(zoom * 100)

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onZoomOut} className="p-1 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary" title="Zoom out">
        <ZoomOut size={14} />
      </button>
      <input
        type="range"
        min="10"
        max="500"
        value={percentage}
        onChange={(e) => onZoomChange(parseInt(e.target.value) / 100)}
        className="w-20 accent-canvas-accent h-1"
        title={`${percentage}%`}
      />
      <button onClick={onZoomIn} className="p-1 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary" title="Zoom in">
        <ZoomIn size={14} />
      </button>
      <span className="text-[10px] text-canvas-text-tertiary w-8">{percentage}%</span>
    </div>
  )
}
