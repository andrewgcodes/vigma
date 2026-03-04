'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useDesignStore } from '@/store/useDesignStore'

const shortcutCategories = [
  {
    title: 'Tools',
    shortcuts: [
      { key: 'V', description: 'Select' },
      { key: 'H', description: 'Hand / Pan' },
      { key: 'R', description: 'Rectangle' },
      { key: 'O', description: 'Ellipse' },
      { key: 'L', description: 'Line' },
      { key: 'T', description: 'Text' },
      { key: 'P', description: 'Pen' },
      { key: 'B', description: 'Brush' },
      { key: 'E', description: 'Eraser' },
      { key: 'F', description: 'Frame' },
      { key: 'I', description: 'Eyedropper' },
      { key: 'C', description: 'Comment' },
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      { key: 'Ctrl+Z', description: 'Undo' },
      { key: 'Ctrl+Shift+Z', description: 'Redo' },
      { key: 'Ctrl+C', description: 'Copy' },
      { key: 'Ctrl+X', description: 'Cut' },
      { key: 'Ctrl+V', description: 'Paste' },
      { key: 'Ctrl+D', description: 'Duplicate' },
      { key: 'Ctrl+A', description: 'Select All' },
      { key: 'Delete', description: 'Delete' },
    ],
  },
  {
    title: 'Arrange',
    shortcuts: [
      { key: 'Ctrl+G', description: 'Group' },
      { key: 'Ctrl+Shift+G', description: 'Ungroup' },
      { key: 'Ctrl+]', description: 'Bring to Front' },
      { key: 'Ctrl+[', description: 'Send to Back' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { key: 'Ctrl+=', description: 'Zoom In' },
      { key: 'Ctrl+-', description: 'Zoom Out' },
      { key: 'Ctrl+0', description: 'Reset Zoom' },
      { key: 'Ctrl+1', description: 'Zoom to Fit' },
      { key: 'Space', description: 'Temporary Hand Tool' },
      { key: '?', description: 'Toggle Shortcuts' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { key: 'Arrow Keys', description: 'Nudge (1px)' },
      { key: 'Shift+Arrow', description: 'Nudge (10px)' },
      { key: 'Escape', description: 'Deselect / Cancel' },
      { key: 'Ctrl+S', description: 'Save Project' },
    ],
  },
]

export default function KeyboardShortcutsModal() {
  const { showShortcutsModal, setShowShortcutsModal } = useDesignStore()

  if (!showShortcutsModal) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-canvas-surface rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-canvas-text">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="p-1.5 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcutCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-xs font-semibold text-canvas-text-tertiary uppercase tracking-wider mb-2">
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-canvas-hover"
                  >
                    <span className="text-xs text-canvas-text">{shortcut.description}</span>
                    <kbd className="text-[10px] font-mono bg-canvas-bg border border-canvas-border rounded px-1.5 py-0.5 text-canvas-text-secondary">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-canvas-border">
          <p className="text-xxs text-canvas-text-tertiary text-center">
            Press <kbd className="font-mono bg-canvas-bg border border-canvas-border rounded px-1 py-0.5">?</kbd> or <kbd className="font-mono bg-canvas-bg border border-canvas-border rounded px-1 py-0.5">Escape</kbd> to close
          </p>
        </div>
      </div>
    </div>
  )
}
