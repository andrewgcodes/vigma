'use client'
import { useState, useEffect, useCallback } from 'react'

interface Command {
  id: string
  label: string
  shortcut?: string
  category: string
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands: Command[]
}

// Feature 401: Command Palette - Quick access to all actions
export default function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const handleSelect = useCallback((cmd: Command) => {
    cmd.action()
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-[480px] bg-white rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full px-4 py-3 text-sm border-b outline-none"
        />
        <div className="max-h-[300px] overflow-y-auto">
          {filtered.length === 0 && <div className="p-4 text-sm text-gray-400 text-center">No commands found</div>}
          {filtered.slice(0, 20).map(cmd => (
            <button
              key={cmd.id}
              onClick={() => handleSelect(cmd)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-blue-50 text-left"
            >
              <span><span className="text-gray-400 text-xs mr-2">{cmd.category}</span>{cmd.label}</span>
              {cmd.shortcut && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cmd.shortcut}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
