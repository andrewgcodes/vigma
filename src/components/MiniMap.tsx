'use client'

import React, { useRef, useEffect, useCallback } from 'react'

// Feature 75: MiniMap component showing canvas overview
interface MiniMapProps {
  canvasWidth: number
  canvasHeight: number
  viewportX: number
  viewportY: number
  zoom: number
  objects: Array<{ left: number; top: number; width: number; height: number; fill?: string }>
  onNavigate: (x: number, y: number) => void
  visible: boolean
}

export default function MiniMap({ canvasWidth, canvasHeight, viewportX, viewportY, zoom, objects, onNavigate, visible }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const miniW = 180
  const miniH = 120

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    // Calculate bounds of all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    objects.forEach(o => {
      minX = Math.min(minX, o.left)
      minY = Math.min(minY, o.top)
      maxX = Math.max(maxX, o.left + o.width)
      maxY = Math.max(maxY, o.top + o.height)
    })

    if (!isFinite(minX)) {
      minX = 0; minY = 0; maxX = 1000; maxY = 1000
    }

    const padding = 100
    minX -= padding; minY -= padding
    maxX += padding; maxY += padding
    const sceneW = maxX - minX
    const sceneH = maxY - minY
    const scale = Math.min(miniW / sceneW, miniH / sceneH)

    ctx.clearRect(0, 0, miniW, miniH)
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, miniW, miniH)

    // Draw objects as small rectangles
    objects.forEach(o => {
      const x = (o.left - minX) * scale
      const y = (o.top - minY) * scale
      const w = Math.max(2, o.width * scale)
      const h = Math.max(2, o.height * scale)
      ctx.fillStyle = (typeof o.fill === 'string' && o.fill) ? o.fill : '#999'
      ctx.fillRect(x, y, w, h)
    })

    // Draw viewport rectangle
    const vpX = (-viewportX / zoom - minX) * scale
    const vpY = (-viewportY / zoom - minY) * scale
    const vpW = (canvasWidth / zoom) * scale
    const vpH = (canvasHeight / zoom) * scale
    ctx.strokeStyle = '#0066FF'
    ctx.lineWidth = 1.5
    ctx.strokeRect(vpX, vpY, vpW, vpH)
  }, [objects, viewportX, viewportY, zoom, canvasWidth, canvasHeight])

  useEffect(() => {
    draw()
  }, [draw])

  if (!visible) return null

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    objects.forEach(o => {
      minX = Math.min(minX, o.left)
      minY = Math.min(minY, o.top)
      maxX = Math.max(maxX, o.left + o.width)
      maxY = Math.max(maxY, o.top + o.height)
    })
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 1000; maxY = 1000 }
    const padding = 100
    minX -= padding; minY -= padding
    maxX += padding; maxY += padding
    const sceneW = maxX - minX
    const sceneH = maxY - minY
    const scale = Math.min(miniW / sceneW, miniH / sceneH)

    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const sceneClickX = clickX / scale + minX
    const sceneClickY = clickY / scale + minY

    onNavigate(sceneClickX, sceneClickY)
  }

  return (
    <div className="fixed bottom-8 right-4 z-30 rounded-xl overflow-hidden shadow-lg border border-canvas-border bg-white">
      <canvas
        ref={canvasRef}
        width={miniW}
        height={miniH}
        onClick={handleClick}
        className="cursor-crosshair"
      />
    </div>
  )
}
