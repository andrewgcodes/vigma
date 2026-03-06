'use client'

import React from 'react'
import { X, Keyboard } from 'lucide-react'

// Feature 71: Keyboard Shortcuts Dialog
interface KeyboardShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

const shortcuts = [
  { category: 'Tools', items: [
    { key: 'V', description: 'Select tool' },
    { key: 'H', description: 'Hand (pan) tool' },
    { key: 'F', description: 'Frame tool' },
    { key: 'R', description: 'Rectangle tool' },
    { key: 'O', description: 'Ellipse tool' },
    { key: 'L', description: 'Line tool' },
    { key: 'T', description: 'Text tool' },
    { key: 'P', description: 'Pen tool' },
    { key: 'B', description: 'Brush tool' },
    { key: 'E', description: 'Eraser tool' },
    { key: 'I', description: 'Eyedropper tool' },
    { key: 'C', description: 'Comment tool' },
  ]},
  { category: 'Edit', items: [
    { key: 'Ctrl+C', description: 'Copy' },
    { key: 'Ctrl+X', description: 'Cut' },
    { key: 'Ctrl+V', description: 'Paste' },
    { key: 'Ctrl+D', description: 'Duplicate' },
    { key: 'Ctrl+A', description: 'Select all' },
    { key: 'Delete', description: 'Delete selected' },
    { key: 'Ctrl+Z', description: 'Undo' },
    { key: 'Ctrl+Shift+Z', description: 'Redo' },
  ]},
  { category: 'Arrange', items: [
    { key: 'Ctrl+]', description: 'Bring to front' },
    { key: 'Ctrl+[', description: 'Send to back' },
    { key: 'Ctrl+G', description: 'Group' },
    { key: 'Ctrl+Shift+G', description: 'Ungroup' },
  ]},
  { category: 'View', items: [
    { key: 'Ctrl+S', description: 'Save project' },
    { key: 'Ctrl+=', description: 'Zoom in' },
    { key: 'Ctrl+-', description: 'Zoom out' },
    { key: 'Ctrl+0', description: 'Reset zoom' },
    { key: 'Ctrl+1', description: 'Zoom to fit' },
    { key: 'Space (hold)', description: 'Pan canvas' },
    { key: 'Scroll', description: 'Zoom in/out' },
  ]},
  { category: 'Transform', items: [
    { key: 'Arrow keys', description: 'Move by 1px' },
    { key: 'Shift+Arrow', description: 'Move by 10px' },
    { key: 'Shift+R', description: 'Rotate 90 degrees' },
    { key: 'Shift+H', description: 'Flip horizontal' },
    { key: 'Shift+V', description: 'Flip vertical' },
  ]},
]

export default function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-canvas-border">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-canvas-accent" />
            <h2 className="text-lg font-semibold text-canvas-text">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-canvas-text mb-2">{section.category}</h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <span className="text-xs text-canvas-text-secondary">{item.description}</span>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-canvas-bg border border-canvas-border rounded text-canvas-text-secondary">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
