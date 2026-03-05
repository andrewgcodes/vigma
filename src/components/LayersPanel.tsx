'use client'

import React, { useState, useRef } from 'react'
import {
  Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown,
  Type, Square, Circle, Triangle, Image, Pen, Frame, Star,
  Hexagon, Minus, ArrowRight, Layers, GripVertical, Trash2,
  Group, Ungroup
} from 'lucide-react'

interface LayerItemData {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
}

interface LayersPanelProps {
  layers: LayerItemData[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onReorder: (id: string, newIndex: number) => void
  onGroup: () => void
  onUngroup: () => void
}

function getLayerIcon(type: string) {
  const size = 14
  switch (type) {
    case 'rect': return <Square size={size} />
    case 'circle': return <Circle size={size} />
    case 'triangle': return <Triangle size={size} />
    case 'textbox': return <Type size={size} />
    case 'image': return <Image size={size} />
    case 'path': return <Pen size={size} />
    case 'line': return <Minus size={size} />
    case 'polygon': return <Hexagon size={size} />
    case 'group': return <Layers size={size} />
    default: return <Square size={size} />
  }
}

export default function LayersPanel({
  layers,
  selectedIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onDelete,
  onReorder,
  onGroup,
  onUngroup,
}: LayersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  // Tracks whether the most recent mousedown happened inside an action button
  // (eye / lock / delete). When the row is `draggable`, even a 1–2px mouse
  // movement during a click fires `dragstart`, which cancels the pending
  // click event — making those buttons impossible to click. We set this flag
  // on mousedown and check it in `handleDragStart` to veto the drag.
  const suppressDragRef = useRef(false)

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id)
    setEditValue(currentName)
  }

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    // If mousedown landed on an action button, cancel the drag so the
    // button's click event can fire. Without this, the draggable row
    // swallows clicks on the eye/lock/delete icons.
    if (suppressDragRef.current) {
      e.preventDefault()
      return
    }
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (dragId && dragId !== targetId) {
      const targetIndex = layers.findIndex(l => l.id === targetId)
      if (targetIndex >= 0) {
        onReorder(dragId, targetIndex)
      }
    }
    setDragId(null)
    setDragOverId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
        <span className="text-xs font-semibold text-canvas-text uppercase tracking-wider">Layers</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onGroup}
            className="p-1 rounded-md hover:bg-canvas-hover text-canvas-text-secondary hover:text-canvas-text transition-colors"
            title="Group selected (Ctrl+G)"
          >
            <Group size={14} />
          </button>
          <button
            onClick={onUngroup}
            className="p-1 rounded-md hover:bg-canvas-hover text-canvas-text-secondary hover:text-canvas-text transition-colors"
            title="Ungroup selected (Ctrl+Shift+G)"
          >
            <Ungroup size={14} />
          </button>
        </div>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-canvas-text-tertiary">
            No layers yet
          </div>
        ) : (
          layers.map((layer, index) => (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={() => { setDragId(null); setDragOverId(null) }}
              onMouseDown={(e) => {
                // Record whether this press started on a button so dragstart can be vetoed.
                suppressDragRef.current = (e.target as HTMLElement).closest('button') !== null
              }}
              onClick={() => onSelect(layer.id)}
              className={`
                group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer border-b border-transparent
                transition-colors duration-100
                ${selectedIds.includes(layer.id)
                  ? 'bg-canvas-accent/8 border-canvas-accent/20'
                  : 'hover:bg-canvas-hover'
                }
                ${dragOverId === layer.id ? 'border-t-2 border-t-canvas-accent' : ''}
                ${dragId === layer.id ? 'opacity-40' : ''}
              `}
            >
              <GripVertical size={10} className="text-canvas-text-tertiary opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />

              <span className={`flex-shrink-0 ${selectedIds.includes(layer.id) ? 'text-canvas-accent' : 'text-canvas-text-secondary'}`}>
                {getLayerIcon(layer.type)}
              </span>

              {editingId === layer.id ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 text-xs bg-white border border-canvas-accent rounded px-1 py-0.5 focus:outline-none min-w-0"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 text-xs text-canvas-text truncate min-w-0"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    startEditing(layer.id, layer.name)
                  }}
                >
                  {layer.name}
                </span>
              )}

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id) }}
                  className="p-0.5 rounded hover:bg-canvas-active text-canvas-text-tertiary"
                >
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id) }}
                  className="p-0.5 rounded hover:bg-canvas-active text-canvas-text-tertiary"
                >
                  {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(layer.id) }}
                  className="p-0.5 rounded hover:bg-red-50 text-canvas-text-tertiary hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Lock/invisible indicators when not hovered */}
              {!layer.visible && (
                <EyeOff size={10} className="text-canvas-text-tertiary group-hover:hidden flex-shrink-0" />
              )}
              {layer.locked && (
                <Lock size={10} className="text-canvas-text-tertiary group-hover:hidden flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
