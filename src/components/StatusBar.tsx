'use client';

import React from 'react';
import { useCanvasStore } from '@/store/canvas-store';

export default function StatusBar() {
  const { zoom, selectedObjectIds, objects, cursorX, cursorY } = useCanvasStore();

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span className="status-item">
          {objects.length} object{objects.length !== 1 ? 's' : ''}
        </span>
        {selectedObjectIds.length > 0 && (
          <span className="status-item highlight">
            {selectedObjectIds.length} selected
          </span>
        )}
      </div>
      <div className="statusbar-right">
        <span className="status-item cursor-pos">
          X: {cursorX} &nbsp; Y: {cursorY}
        </span>
        <span className="status-item">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
