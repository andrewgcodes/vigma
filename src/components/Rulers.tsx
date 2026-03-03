'use client';

import React, { useEffect, useState, useRef } from 'react';
import { canvasEngine } from '@/lib/canvas-engine';

export default function Rulers() {
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    drawHorizontalRuler();
    drawVerticalRuler();
  });

  const drawHorizontalRuler = () => {
    const canvas = hRulerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = 20;

    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = canvasEngine.getRulerData();
    const vpt = canvasEngine.getViewportTransform();
    const zoom = vpt[0];
    const offsetX = vpt[4];

    ctx.fillStyle = '#6e6e73';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';

    data.horizontal.forEach((val) => {
      const x = val * zoom + offsetX;
      if (x < 0 || x > canvas.width) return;

      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, 20);
      ctx.strokeStyle = '#d2d2d7';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillText(String(val), x, 12);
    });

    // Bottom border
    ctx.beginPath();
    ctx.moveTo(0, 19.5);
    ctx.lineTo(canvas.width, 19.5);
    ctx.strokeStyle = '#e5e5ea';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawVerticalRuler = () => {
    const canvas = vRulerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = 20;
    canvas.height = parent.clientHeight;

    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = canvasEngine.getRulerData();
    const vpt = canvasEngine.getViewportTransform();
    const zoom = vpt[0];
    const offsetY = vpt[5];

    ctx.fillStyle = '#6e6e73';
    ctx.font = '9px Inter, sans-serif';

    data.vertical.forEach((val) => {
      const y = val * zoom + offsetY;
      if (y < 0 || y > canvas.height) return;

      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(20, y);
      ctx.strokeStyle = '#d2d2d7';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(10, y);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(String(val), 0, 3);
      ctx.restore();
    });

    // Right border
    ctx.beginPath();
    ctx.moveTo(19.5, 0);
    ctx.lineTo(19.5, canvas.height);
    ctx.strokeStyle = '#e5e5ea';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  return (
    <>
      {/* Corner square */}
      <div className="ruler-corner" />
      {/* Horizontal ruler */}
      <div className="ruler-horizontal">
        <canvas ref={hRulerRef} />
      </div>
      {/* Vertical ruler */}
      <div className="ruler-vertical">
        <canvas ref={vRulerRef} />
      </div>
    </>
  );
}
