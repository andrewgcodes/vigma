'use client'

import React, { useEffect, useRef } from 'react'

interface RulersProps {
  zoom: number
  panX: number
  panY: number
  showRulers: boolean
  leftOffset: number
  topOffset: number
}

export default function Rulers({ zoom, panX, panY, showRulers, leftOffset, topOffset }: RulersProps) {
  const hRef = useRef<HTMLCanvasElement>(null)
  const vRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!showRulers) return
    drawHorizontalRuler()
    drawVerticalRuler()
  }, [zoom, panX, panY, showRulers, leftOffset, topOffset])

  const drawHorizontalRuler = () => {
    const canvas = hRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = window.innerWidth - leftOffset
    canvas.width = width
    canvas.height = 20

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, width, 20)
    ctx.strokeStyle = '#e5e5e7'
    ctx.lineWidth = 1
    ctx.moveTo(0, 19.5)
    ctx.lineTo(width, 19.5)
    ctx.stroke()

    ctx.fillStyle = '#999'
    ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'

    const step = getStep(zoom)
    const startX = Math.floor(-panX / zoom / step) * step
    const endX = startX + width / zoom + step

    for (let x = startX; x <= endX; x += step) {
      const screenX = x * zoom + panX
      if (screenX < 0 || screenX > width) continue

      ctx.beginPath()
      if (x % (step * 5) === 0) {
        ctx.moveTo(screenX, 8)
        ctx.lineTo(screenX, 20)
        ctx.strokeStyle = '#bbb'
        ctx.stroke()
        ctx.fillText(`${Math.round(x)}`, screenX, 7)
      } else {
        ctx.moveTo(screenX, 14)
        ctx.lineTo(screenX, 20)
        ctx.strokeStyle = '#ddd'
        ctx.stroke()
      }
    }
  }

  const drawVerticalRuler = () => {
    const canvas = vRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const height = window.innerHeight - topOffset
    canvas.width = 20
    canvas.height = height

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, 20, height)
    ctx.strokeStyle = '#e5e5e7'
    ctx.lineWidth = 1
    ctx.moveTo(19.5, 0)
    ctx.lineTo(19.5, height)
    ctx.stroke()

    ctx.fillStyle = '#999'
    ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif'

    const step = getStep(zoom)
    const startY = Math.floor(-panY / zoom / step) * step
    const endY = startY + height / zoom + step

    for (let y = startY; y <= endY; y += step) {
      const screenY = y * zoom + panY
      if (screenY < 0 || screenY > height) continue

      ctx.beginPath()
      if (y % (step * 5) === 0) {
        ctx.moveTo(8, screenY)
        ctx.lineTo(20, screenY)
        ctx.strokeStyle = '#bbb'
        ctx.stroke()
        ctx.save()
        ctx.translate(7, screenY)
        ctx.rotate(-Math.PI / 2)
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.round(y)}`, 0, 0)
        ctx.restore()
      } else {
        ctx.moveTo(14, screenY)
        ctx.lineTo(20, screenY)
        ctx.strokeStyle = '#ddd'
        ctx.stroke()
      }
    }
  }

  const getStep = (zoom: number) => {
    if (zoom >= 4) return 5
    if (zoom >= 2) return 10
    if (zoom >= 1) return 20
    if (zoom >= 0.5) return 50
    if (zoom >= 0.25) return 100
    return 200
  }

  if (!showRulers) return null

  return (
    <>
      {/* Horizontal ruler */}
      <canvas
        ref={hRef}
        className="absolute z-30 pointer-events-none"
        style={{ left: leftOffset, top: topOffset, height: 20 }}
      />
      {/* Vertical ruler */}
      <canvas
        ref={vRef}
        className="absolute z-30 pointer-events-none"
        style={{ left: leftOffset, top: topOffset + 20, width: 20 }}
      />
      {/* Corner */}
      <div
        className="absolute z-30 bg-[#fafafa] border-r border-b border-canvas-border"
        style={{ left: leftOffset, top: topOffset, width: 20, height: 20 }}
      />
    </>
  )
}
