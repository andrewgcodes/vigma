'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import Toolbar from '@/components/Toolbar';
import LayersPanel from '@/components/LayersPanel';
import PropertiesPanel from '@/components/PropertiesPanel';
import StatusBar from '@/components/StatusBar';
import Rulers from '@/components/Rulers';
import { useCanvasStore } from '@/store/canvas-store';

const DesignCanvas = dynamic(() => import('@/components/DesignCanvas'), {
  ssr: false,
  loading: () => (
    <div className="canvas-loading">
      <div className="loading-spinner" />
      <span>Loading canvas...</span>
    </div>
  ),
});

export default function Home() {
  const { showLayers, showProperties } = useCanvasStore();
  const [layersPanelWidth, setLayersPanelWidth] = useState(240);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(260);
  const [showRulers] = useState(true);

  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault();
    if (side === 'left') {
      isDraggingLeft.current = true;
      startX.current = e.clientX;
      startWidth.current = layersPanelWidth;
    } else {
      isDraggingRight.current = true;
      startX.current = e.clientX;
      startWidth.current = propertiesPanelWidth;
    }
  }, [layersPanelWidth, propertiesPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        const delta = e.clientX - startX.current;
        const newWidth = Math.max(180, Math.min(400, startWidth.current + delta));
        setLayersPanelWidth(newWidth);
      }
      if (isDraggingRight.current) {
        const delta = startX.current - e.clientX;
        const newWidth = Math.max(200, Math.min(450, startWidth.current + delta));
        setPropertiesPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="app-layout">
      <TopBar />
      <div className="workspace">
        <Toolbar />
        <div className="canvas-area">
          {showLayers && (
            <>
              <div style={{ width: layersPanelWidth, flexShrink: 0 }}>
                <LayersPanel />
              </div>
              <div
                className="panel-resize-handle"
                onMouseDown={(e) => handleMouseDown('left', e)}
              />
            </>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {showRulers && <Rulers />}
            <DesignCanvas />
          </div>
          {showProperties && (
            <>
              <div
                className="panel-resize-handle"
                onMouseDown={(e) => handleMouseDown('right', e)}
              />
              <div style={{ width: propertiesPanelWidth, flexShrink: 0 }}>
                <PropertiesPanel />
              </div>
            </>
          )}
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
