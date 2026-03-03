'use client'

import React, { useState } from 'react'
import { Plus, Trash2, FileText } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface PageData {
  id: string
  name: string
}

interface PagesPanelProps {
  pages: PageData[]
  currentPageId: string
  onSelectPage: (id: string) => void
  onAddPage: () => void
  onDeletePage: (id: string) => void
  onRenamePage: (id: string, name: string) => void
}

export default function PagesPanel({
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
}: PagesPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEditing = (id: string, name: string) => {
    setEditingId(id)
    setEditValue(name)
  }

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      onRenamePage(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
        <span className="text-xs font-semibold text-canvas-text uppercase tracking-wider">Pages</span>
        <button
          onClick={onAddPage}
          className="p-1 rounded-md hover:bg-canvas-hover text-canvas-text-secondary hover:text-canvas-text transition-colors"
          title="Add page"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pages.map((page) => (
          <div
            key={page.id}
            onClick={() => onSelectPage(page.id)}
            className={`
              group flex items-center gap-2 px-3 py-2 cursor-pointer
              transition-colors duration-100
              ${currentPageId === page.id
                ? 'bg-canvas-accent/8 border-l-2 border-canvas-accent'
                : 'hover:bg-canvas-hover border-l-2 border-transparent'
              }
            `}
          >
            <FileText size={14} className={currentPageId === page.id ? 'text-canvas-accent' : 'text-canvas-text-secondary'} />

            {editingId === page.id ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditing()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 text-xs bg-white border border-canvas-accent rounded px-1 py-0.5 focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-xs text-canvas-text truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  startEditing(page.id, page.name)
                }}
              >
                {page.name}
              </span>
            )}

            {pages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeletePage(page.id) }}
                className="p-0.5 rounded hover:bg-red-50 text-canvas-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
