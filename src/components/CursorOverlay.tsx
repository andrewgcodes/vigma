'use client'

import React from 'react'
import type { RemoteUser } from '@/lib/collaboration'

interface CursorOverlayProps {
  users: RemoteUser[]
  zoom: number
  panX: number
  panY: number
}

export default function CursorOverlay({ users, zoom, panX, panY }: CursorOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 40 }}>
      {users.map((user) => {
        if (!user.cursor) return null

        // Convert canvas coordinates to screen coordinates
        const screenX = user.cursor.x * zoom + panX
        const screenY = user.cursor.y * zoom + panY

        return (
          <div
            key={user.id}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: screenX,
              top: screenY,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M3 3L10 17L12.5 10.5L19 8L3 3Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-white text-[10px] font-medium whitespace-nowrap shadow-sm"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
