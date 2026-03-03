'use client';

import React from 'react';
import { useCollabStore } from '@/store/collab-store';

export default function RemoteCursors() {
  const cursors = useCollabStore((s) => s.cursors);
  const userId = useCollabStore((s) => s.userId);

  const cursorEntries = Object.values(cursors).filter(
    (c) => c.userId !== userId && Date.now() - c.lastUpdate < 10000
  );

  if (cursorEntries.length === 0) return null;

  return (
    <div className="remote-cursors-overlay">
      {cursorEntries.map((cursor) => (
        <div
          key={cursor.userId}
          className="remote-cursor"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          }}
        >
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M0 0L16 12.5L8.5 13.5L12 20L9 21L5.5 14.5L0 19V0Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          <span
            className="remote-cursor-label"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </span>
        </div>
      ))}
    </div>
  );
}
