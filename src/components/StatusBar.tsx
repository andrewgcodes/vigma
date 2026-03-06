'use client'

import React from 'react'
import { useDesignStore } from '@/store/useDesignStore'

// Feature 72: Status Bar with cursor coordinates, object count, zoom, canvas info
export default function StatusBar({ objectCount, zoom }: { objectCount: number; zoom: number }) {
  const { cursorPosition, showStatusBar } = useDesignStore()

  if (!showStatusBar) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 bg-white/90 backdrop-blur-sm border-t border-canvas-border z-30 flex items-center justify-between px-3 text-[10px] text-canvas-text-tertiary">
      <div className="flex items-center gap-3">
        <span title="Cursor position">X: {cursorPosition.x} Y: {cursorPosition.y}</span>
        <span className="w-px h-3 bg-canvas-border" />
        <span title="Total objects on canvas">{objectCount} object{objectCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-3">
        <span title="Current zoom level">Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}
