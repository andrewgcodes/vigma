'use client'

import React from 'react'
import { Trash2, Copy, Lock, Unlock, Eye, EyeOff, FlipHorizontal, FlipVertical, RotateCw } from 'lucide-react'

// Feature 87: Bulk Operations Bar - quick actions for multiple selected objects
interface BulkOperationsBarProps {
  selectedCount: number
  onDelete: () => void
  onDuplicate: () => void
  onLock: () => void
  onUnlock: () => void
  onShow: () => void
  onHide: () => void
  onFlipH: () => void
  onFlipV: () => void
  onRotate90: () => void
}

export default function BulkOperationsBar({
  selectedCount, onDelete, onDuplicate, onLock, onUnlock, onShow, onHide, onFlipH, onFlipV, onRotate90
}: BulkOperationsBarProps) {
  if (selectedCount < 2) return null

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white rounded-xl shadow-lg border border-canvas-border px-2 py-1.5 flex items-center gap-1">
        <span className="text-[10px] text-canvas-text-tertiary px-2">{selectedCount} selected</span>
        <div className="w-px h-4 bg-canvas-border" />
        {[
          { icon: <Copy size={14} />, onClick: onDuplicate, title: 'Duplicate' },
          { icon: <Trash2 size={14} />, onClick: onDelete, title: 'Delete' },
          { icon: <Lock size={14} />, onClick: onLock, title: 'Lock' },
          { icon: <Unlock size={14} />, onClick: onUnlock, title: 'Unlock' },
          { icon: <Eye size={14} />, onClick: onShow, title: 'Show' },
          { icon: <EyeOff size={14} />, onClick: onHide, title: 'Hide' },
          { icon: <FlipHorizontal size={14} />, onClick: onFlipH, title: 'Flip H' },
          { icon: <FlipVertical size={14} />, onClick: onFlipV, title: 'Flip V' },
          { icon: <RotateCw size={14} />, onClick: onRotate90, title: 'Rotate 90' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            className="p-1.5 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary transition-colors"
            title={btn.title}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
