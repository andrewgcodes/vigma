'use client'

import React from 'react'
import {
  MousePointer2, Hand, Square, Circle, Triangle, Type, Pen,
  Pencil, Minus, ArrowRight, Star, Hexagon, Image, Frame,
  Paintbrush, Eraser, Pipette, MessageCircle
} from 'lucide-react'
import { useDesignStore } from '@/store/useDesignStore'
import type { ToolType } from '@/types/design'

interface ToolDef {
  id: ToolType
  icon: React.ReactNode
  label: string
  shortcut?: string
}

const tools: ToolDef[] = [
  { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select', shortcut: 'V' },
  { id: 'hand', icon: <Hand size={18} />, label: 'Hand', shortcut: 'H' },
  { id: 'frame', icon: <Frame size={18} />, label: 'Frame', shortcut: 'F' },
  { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse', shortcut: 'O' },
  { id: 'triangle', icon: <Triangle size={18} />, label: 'Triangle' },
  { id: 'line', icon: <Minus size={18} />, label: 'Line', shortcut: 'L' },
  { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow' },
  { id: 'polygon', icon: <Hexagon size={18} />, label: 'Polygon' },
  { id: 'star', icon: <Star size={18} />, label: 'Star' },
  { id: 'text', icon: <Type size={18} />, label: 'Text', shortcut: 'T' },
  { id: 'pen', icon: <Pen size={18} />, label: 'Pen', shortcut: 'P' },
  { id: 'pencil', icon: <Pencil size={18} />, label: 'Pencil' },
  { id: 'brush', icon: <Paintbrush size={18} />, label: 'Brush', shortcut: 'B' },
  { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser', shortcut: 'E' },
  { id: 'image', icon: <Image size={18} />, label: 'Image' },
  { id: 'eyedropper', icon: <Pipette size={18} />, label: 'Eyedropper', shortcut: 'I' },
  { id: 'comment', icon: <MessageCircle size={18} />, label: 'Comment', shortcut: 'C' },
]

export default function Toolbar() {
  const { activeTool, setActiveTool } = useDesignStore()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-0.5 bg-white rounded-2xl shadow-toolbar px-2 py-1.5">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`
              relative group flex items-center justify-center w-9 h-9 rounded-xl
              transition-all duration-150 ease-out
              ${activeTool === tool.id
                ? 'bg-canvas-accent text-white shadow-sm'
                : 'text-canvas-text-secondary hover:bg-canvas-hover hover:text-canvas-text'
              }
            `}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          >
            {tool.icon}
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="bg-canvas-text text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                {tool.label}
                {tool.shortcut && (
                  <span className="ml-1.5 text-white/60">{tool.shortcut}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
