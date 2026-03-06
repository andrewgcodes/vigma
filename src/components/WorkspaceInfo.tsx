'use client'

import React from 'react'
import { X, Info } from 'lucide-react'

// Feature 88: Workspace Info panel showing canvas statistics
interface WorkspaceInfoProps {
  open: boolean
  onClose: () => void
  stats: { total: number; byType: Record<string, number> }
  pageCount: number
  currentPage: string
  zoom: number
  canvasSize: { width: number; height: number }
}

export default function WorkspaceInfo({ open, onClose, stats, pageCount, currentPage, zoom, canvasSize }: WorkspaceInfoProps) {
  if (!open) return null

  return (
    <div className="fixed top-16 right-4 z-[9998] bg-white rounded-2xl shadow-2xl border border-canvas-border w-64 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-canvas-accent" />
          <h3 className="text-sm font-semibold text-canvas-text">Workspace Info</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-canvas-text-secondary">Current Page</span>
          <span className="text-canvas-text font-medium">{currentPage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-canvas-text-secondary">Total Pages</span>
          <span className="text-canvas-text font-medium">{pageCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-canvas-text-secondary">Total Objects</span>
          <span className="text-canvas-text font-medium">{stats.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-canvas-text-secondary">Zoom</span>
          <span className="text-canvas-text font-medium">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-canvas-text-secondary">Canvas Size</span>
          <span className="text-canvas-text font-medium">{canvasSize.width} x {canvasSize.height}</span>
        </div>
        {Object.keys(stats.byType).length > 0 && (
          <>
            <div className="border-t border-canvas-border pt-2 mt-2">
              <span className="text-canvas-text-secondary font-medium block mb-1">Objects by Type</span>
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between py-0.5">
                  <span className="text-canvas-text-tertiary capitalize">{type}</span>
                  <span className="text-canvas-text">{count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
