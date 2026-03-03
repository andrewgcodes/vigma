'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import * as fabric from 'fabric';
import { useStore } from '@/store/useStore';

interface ZoomBarProps {
  fabricRef: React.RefObject<fabric.Canvas | null>;
}

export default function ZoomBar({ fabricRef }: ZoomBarProps) {
  const { zoom, setZoom } = useStore();

  const handleZoomIn = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let newZoom = canvas.getZoom() * 1.2;
    if (newZoom > 5) newZoom = 5;
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(new fabric.Point(center.x, center.y), newZoom);
    setZoom(Math.round(newZoom * 100));
  };

  const handleZoomOut = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let newZoom = canvas.getZoom() / 1.2;
    if (newZoom < 0.1) newZoom = 0.1;
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(new fabric.Point(center.x, center.y), newZoom);
    setZoom(Math.round(newZoom * 100));
  };

  const handleFitToScreen = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(100);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 px-1.5 py-1.5 flex items-center gap-1">
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <div className="px-2 min-w-[52px] text-center">
          <span className="text-xs font-medium text-gray-600 font-mono">{zoom}%</span>
        </div>

        <button
          onClick={handleZoomIn}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <button
          onClick={handleFitToScreen}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fit to Screen"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
}
