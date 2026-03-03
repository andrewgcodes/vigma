'use client';

import React from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import Toolbar from './Toolbar';
import TopBar from './TopBar';
import LayersPanel from './LayersPanel';
import PropertiesPanel from './PropertiesPanel';
import ZoomBar from './ZoomBar';
import KeyboardShortcuts from './KeyboardShortcuts';
import ContextMenu from './ContextMenu';
import { useStore } from '@/store/useStore';

export default function Editor() {
  const { canvasRef, fabricRef } = useCanvas();
  const { activeTool } = useStore();

  const getCursorClass = () => {
    switch (activeTool) {
      case 'hand': return 'cursor-grab';
      case 'select': return 'cursor-default';
      case 'pen': return 'cursor-crosshair';
      case 'text': return 'cursor-text';
      case 'eyedropper': return 'cursor-crosshair';
      case 'frame': return 'cursor-crosshair';
      default: return 'cursor-crosshair';
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden bg-gray-50 ${getCursorClass()}`}>
      <canvas ref={canvasRef} className="block" />
      <TopBar fabricRef={fabricRef} />
      <Toolbar fabricRef={fabricRef} />
      <LayersPanel fabricRef={fabricRef} />
      <ContextMenu fabricRef={fabricRef} />
      <PropertiesPanel fabricRef={fabricRef} />
      <ZoomBar fabricRef={fabricRef} />
      <KeyboardShortcuts fabricRef={fabricRef} />
    </div>
  );
}
