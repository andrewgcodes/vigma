'use client'

import React from 'react'
import { X, Grid3X3 } from 'lucide-react'
import { useDesignStore } from '@/store/useDesignStore'

// Feature 77: Grid Settings Panel
interface GridSettingsPanelProps {
  open: boolean
  onClose: () => void
  gridSize: number
  onGridSizeChange: (size: number) => void
  gridEnabled: boolean
  onToggleGrid: () => void
  snapEnabled: boolean
  onToggleSnap: () => void
}

export default function GridSettingsPanel({ open, onClose, gridSize, onGridSizeChange, gridEnabled, onToggleGrid, snapEnabled, onToggleSnap }: GridSettingsPanelProps) {
  if (!open) return null

  const { gridColor, setGridColor } = useDesignStore()

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9998] bg-white rounded-2xl shadow-2xl border border-canvas-border w-72 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border">
        <div className="flex items-center gap-2">
          <Grid3X3 size={16} className="text-canvas-accent" />
          <h3 className="text-sm font-semibold text-canvas-text">Grid Settings</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-canvas-text-secondary">Show Grid</span>
          <button
            onClick={onToggleGrid}
            className={`w-8 h-4.5 rounded-full transition-colors ${gridEnabled ? 'bg-canvas-accent' : 'bg-gray-300'}`}
          >
            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${gridEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-canvas-text-secondary">Snap to Grid</span>
          <button
            onClick={onToggleSnap}
            className={`w-8 h-4.5 rounded-full transition-colors ${snapEnabled ? 'bg-canvas-accent' : 'bg-gray-300'}`}
          >
            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${snapEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div>
          <span className="text-xs text-canvas-text-secondary mb-1 block">Grid Size</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="5"
              max="100"
              value={gridSize}
              onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
              className="flex-1 accent-canvas-accent"
            />
            <span className="text-xs text-canvas-text w-8 text-right">{gridSize}px</span>
          </div>
        </div>
        <div>
          <span className="text-xs text-canvas-text-secondary mb-1 block">Grid Color</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={gridColor}
              onChange={(e) => setGridColor(e.target.value)}
              className="w-6 h-6 rounded border border-canvas-border cursor-pointer"
            />
            <span className="text-xs text-canvas-text-secondary">{gridColor}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
