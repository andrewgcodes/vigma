'use client';

import React, { useRef, useEffect } from 'react';
import { useDesignStore } from '@/store/useDesignStore';

interface RulersProps {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panX: number;
  panY: number;
}

const RULER_SIZE = 24;

export default function Rulers({ canvasWidth, canvasHeight, zoom, panX, panY }: RulersProps) {
  const showRulers = useDesignStore((s) => s.showRulers);
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showRulers) return;

    // Draw horizontal ruler
    const hCanvas = hRulerRef.current;
    if (hCanvas) {
      const ctx = hCanvas.getContext('2d');
      if (!ctx) return;
      hCanvas.width = canvasWidth;
      hCanvas.height = RULER_SIZE;

      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, canvasWidth, RULER_SIZE);

      ctx.strokeStyle = '#e5e5e7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, RULER_SIZE - 0.5);
      ctx.lineTo(canvasWidth, RULER_SIZE - 0.5);
      ctx.stroke();

      // Calculate step based on zoom
      let step = 100;
      if (zoom > 2) step = 50;
      if (zoom > 4) step = 25;
      if (zoom > 8) step = 10;
      if (zoom < 0.5) step = 200;
      if (zoom < 0.25) step = 500;

      ctx.fillStyle = '#86868b';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.textAlign = 'center';

      const startX = -Math.ceil(panX / (step * zoom)) * step;
      const endX = startX + canvasWidth / zoom + step * 2;

      for (let x = startX; x < endX; x += step) {
        const screenX = x * zoom + panX;
        if (screenX < RULER_SIZE || screenX > canvasWidth) continue;

        ctx.beginPath();
        ctx.moveTo(screenX, RULER_SIZE - 8);
        ctx.lineTo(screenX, RULER_SIZE);
        ctx.strokeStyle = '#c0c0c0';
        ctx.stroke();

        ctx.fillText(Math.round(x).toString(), screenX, RULER_SIZE - 10);

        // Minor ticks
        for (let i = 1; i < 10; i++) {
          const minorX = screenX + (i * step * zoom) / 10;
          if (minorX > canvasWidth) break;
          ctx.beginPath();
          ctx.moveTo(minorX, RULER_SIZE - (i === 5 ? 6 : 3));
          ctx.lineTo(minorX, RULER_SIZE);
          ctx.strokeStyle = '#d0d0d0';
          ctx.stroke();
        }
      }
    }

    // Draw vertical ruler
    const vCanvas = vRulerRef.current;
    if (vCanvas) {
      const ctx = vCanvas.getContext('2d');
      if (!ctx) return;
      vCanvas.width = RULER_SIZE;
      vCanvas.height = canvasHeight;

      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, RULER_SIZE, canvasHeight);

      ctx.strokeStyle = '#e5e5e7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(RULER_SIZE - 0.5, 0);
      ctx.lineTo(RULER_SIZE - 0.5, canvasHeight);
      ctx.stroke();

      let step = 100;
      if (zoom > 2) step = 50;
      if (zoom > 4) step = 25;
      if (zoom > 8) step = 10;
      if (zoom < 0.5) step = 200;
      if (zoom < 0.25) step = 500;

      ctx.fillStyle = '#86868b';
      ctx.font = '9px -apple-system, sans-serif';

      const startY = -Math.ceil(panY / (step * zoom)) * step;
      const endY = startY + canvasHeight / zoom + step * 2;

      for (let y = startY; y < endY; y += step) {
        const screenY = y * zoom + panY;
        if (screenY < RULER_SIZE || screenY > canvasHeight) continue;

        ctx.beginPath();
        ctx.moveTo(RULER_SIZE - 8, screenY);
        ctx.lineTo(RULER_SIZE, screenY);
        ctx.strokeStyle = '#c0c0c0';
        ctx.stroke();

        ctx.save();
        ctx.translate(RULER_SIZE - 10, screenY);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(y).toString(), 0, 0);
        ctx.restore();

        for (let i = 1; i < 10; i++) {
          const minorY = screenY + (i * step * zoom) / 10;
          if (minorY > canvasHeight) break;
          ctx.beginPath();
          ctx.moveTo(RULER_SIZE - (i === 5 ? 6 : 3), minorY);
          ctx.lineTo(RULER_SIZE, minorY);
          ctx.strokeStyle = '#d0d0d0';
          ctx.stroke();
        }
      }
    }
  }, [showRulers, canvasWidth, canvasHeight, zoom, panX, panY]);

  if (!showRulers) return null;

  return (
    <>
      {/* Corner square */}
      <div
        className="fixed z-30 bg-gray-50 border-r border-b border-canvas-border"
        style={{ width: RULER_SIZE, height: RULER_SIZE, top: 48, left: 0 }}
      />
      {/* Horizontal ruler */}
      <canvas
        ref={hRulerRef}
        className="fixed z-30"
        style={{ top: 48, left: RULER_SIZE, height: RULER_SIZE }}
      />
      {/* Vertical ruler */}
      <canvas
        ref={vRulerRef}
        className="fixed z-30"
        style={{ top: 48 + RULER_SIZE, left: 0, width: RULER_SIZE }}
      />
    </>
  );
}
