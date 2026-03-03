import { useEffect, useRef } from 'react';
import { useAppContext } from '../../store/canvasStore';

const RULER_SIZE = 20;
const TICK_COLOR = '#555555';
const TEXT_COLOR = '#888888';
const BG_COLOR = '#1e1e1e';
const BORDER_COLOR = '#3c3c3c';

export default function Rulers() {
  const { canvasRef, state } = useAppContext();
  const topRulerRef = useRef<HTMLCanvasElement>(null);
  const leftRulerRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const drawRulers = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      const offsetX = vpt[4];
      const offsetY = vpt[5];

      // Draw top ruler
      const topCanvas = topRulerRef.current;
      if (topCanvas) {
        const ctx = topCanvas.getContext('2d');
        if (ctx) {
          const w = topCanvas.width;
          ctx.clearRect(0, 0, w, RULER_SIZE);
          ctx.fillStyle = BG_COLOR;
          ctx.fillRect(0, 0, w, RULER_SIZE);

          // Calculate step size based on zoom
          let step = 100;
          if (zoom >= 2) step = 50;
          if (zoom >= 4) step = 25;
          if (zoom < 0.5) step = 200;
          if (zoom < 0.25) step = 500;

          const startX = Math.floor(-offsetX / zoom / step) * step;
          const endX = Math.ceil((w - offsetX) / zoom / step) * step;

          ctx.strokeStyle = TICK_COLOR;
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '9px Inter, sans-serif';
          ctx.textAlign = 'center';

          for (let x = startX; x <= endX; x += step) {
            const screenX = x * zoom + offsetX;
            if (screenX < 0 || screenX > w) continue;

            // Major tick
            ctx.beginPath();
            ctx.moveTo(screenX, RULER_SIZE - 8);
            ctx.lineTo(screenX, RULER_SIZE);
            ctx.stroke();
            ctx.fillText(String(Math.round(x)), screenX, RULER_SIZE - 10);

            // Minor ticks
            const minorStep = step / 5;
            for (let mx = x + minorStep; mx < x + step; mx += minorStep) {
              const mScreenX = mx * zoom + offsetX;
              if (mScreenX < 0 || mScreenX > w) continue;
              ctx.beginPath();
              ctx.moveTo(mScreenX, RULER_SIZE - 4);
              ctx.lineTo(mScreenX, RULER_SIZE);
              ctx.stroke();
            }
          }

          // Bottom border
          ctx.strokeStyle = BORDER_COLOR;
          ctx.beginPath();
          ctx.moveTo(0, RULER_SIZE - 0.5);
          ctx.lineTo(w, RULER_SIZE - 0.5);
          ctx.stroke();
        }
      }

      // Draw left ruler
      const leftCanvas = leftRulerRef.current;
      if (leftCanvas) {
        const ctx = leftCanvas.getContext('2d');
        if (ctx) {
          const h = leftCanvas.height;
          ctx.clearRect(0, 0, RULER_SIZE, h);
          ctx.fillStyle = BG_COLOR;
          ctx.fillRect(0, 0, RULER_SIZE, h);

          let step = 100;
          if (zoom >= 2) step = 50;
          if (zoom >= 4) step = 25;
          if (zoom < 0.5) step = 200;
          if (zoom < 0.25) step = 500;

          const startY = Math.floor(-offsetY / zoom / step) * step;
          const endY = Math.ceil((h - offsetY) / zoom / step) * step;

          ctx.strokeStyle = TICK_COLOR;
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '9px Inter, sans-serif';

          for (let y = startY; y <= endY; y += step) {
            const screenY = y * zoom + offsetY;
            if (screenY < 0 || screenY > h) continue;

            // Major tick
            ctx.beginPath();
            ctx.moveTo(RULER_SIZE - 8, screenY);
            ctx.lineTo(RULER_SIZE, screenY);
            ctx.stroke();

            // Draw text rotated
            ctx.save();
            ctx.translate(RULER_SIZE - 12, screenY);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.fillText(String(Math.round(y)), 0, 0);
            ctx.restore();

            // Minor ticks
            const minorStep = step / 5;
            for (let my = y + minorStep; my < y + step; my += minorStep) {
              const mScreenY = my * zoom + offsetY;
              if (mScreenY < 0 || mScreenY > h) continue;
              ctx.beginPath();
              ctx.moveTo(RULER_SIZE - 4, mScreenY);
              ctx.lineTo(RULER_SIZE, mScreenY);
              ctx.stroke();
            }
          }

          // Right border
          ctx.strokeStyle = BORDER_COLOR;
          ctx.beginPath();
          ctx.moveTo(RULER_SIZE - 0.5, 0);
          ctx.lineTo(RULER_SIZE - 0.5, h);
          ctx.stroke();
        }
      }
    };

    const tick = () => {
      drawRulers();
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [canvasRef, state.zoom]);

  // Resize canvases
  useEffect(() => {
    const handleResize = () => {
      const topCanvas = topRulerRef.current;
      const leftCanvas = leftRulerRef.current;
      if (topCanvas) {
        topCanvas.width = topCanvas.parentElement?.clientWidth || window.innerWidth;
        topCanvas.height = RULER_SIZE;
      }
      if (leftCanvas) {
        leftCanvas.width = RULER_SIZE;
        leftCanvas.height = leftCanvas.parentElement?.clientHeight || window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Top ruler */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: RULER_SIZE, marginLeft: RULER_SIZE }}
      >
        <canvas ref={topRulerRef} style={{ width: '100%', height: RULER_SIZE }} />
      </div>
      {/* Left ruler */}
      <div
        className="absolute top-0 left-0 bottom-0 z-10 pointer-events-none"
        style={{ width: RULER_SIZE, marginTop: RULER_SIZE }}
      >
        <canvas ref={leftRulerRef} style={{ width: RULER_SIZE, height: '100%' }} />
      </div>
      {/* Corner square */}
      <div
        className="absolute top-0 left-0 z-20 pointer-events-none"
        style={{
          width: RULER_SIZE,
          height: RULER_SIZE,
          backgroundColor: BG_COLOR,
          borderRight: `1px solid ${BORDER_COLOR}`,
          borderBottom: `1px solid ${BORDER_COLOR}`,
        }}
      />
    </>
  );
}
