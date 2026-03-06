'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

// Feature 86: Search/Filter Layers
interface SearchLayersProps {
  query: string
  onChange: (query: string) => void
}

export default function SearchLayers({ query, onChange }: SearchLayersProps) {
  return (
    <div className="px-3 py-2 border-b border-canvas-border">
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-canvas-text-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search layers..."
          className="w-full pl-7 pr-7 py-1 text-xs bg-canvas-bg border border-canvas-border rounded-lg text-canvas-text placeholder:text-canvas-text-tertiary focus:outline-none focus:ring-1 focus:ring-canvas-accent"
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-canvas-text-tertiary hover:text-canvas-text"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
