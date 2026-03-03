'use client';

import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

export default function StatusBar() {
  const { zoom, setZoom, activeTool, selectedObjectIds } = useEditorStore();

  return (
    <div className="flex items-center h-7 bg-toolbar-bg border-t border-panel-border px-3 text-xs text-text-muted select-none">
      <span className="mr-4">
        Tool: <span className="text-text-secondary capitalize">{activeTool}</span>
      </span>

      {selectedObjectIds.length > 0 && (
        <span className="mr-4">
          Selected: <span className="text-text-secondary">{selectedObjectIds.length}</span>
        </span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom(zoom - 10)}
          className="hover:text-text-primary transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={12} />
        </button>
        <span className="text-text-secondary w-10 text-center">{zoom}%</span>
        <button
          onClick={() => setZoom(zoom + 10)}
          className="hover:text-text-primary transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={12} />
        </button>
      </div>
    </div>
  );
}
