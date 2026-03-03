'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

interface CropOverlayProps {
  // Image bounding box in screen (viewport) coordinates
  imageRect: { left: number; top: number; width: number; height: number }
  // Current crop insets as fractions (0-1) of image dimensions
  initialCrop?: { top: number; right: number; bottom: number; left: number }
  onApply: (crop: { left: number; top: number; width: number; height: number }) => void
  onCancel: () => void
}

type DragEdge = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null

export default function CropOverlay({ imageRect, initialCrop, onApply, onCancel }: CropOverlayProps) {
  // Crop insets as pixels relative to imageRect
  const [cropTop, setCropTop] = useState(initialCrop ? initialCrop.top * imageRect.height : 0)
  const [cropRight, setCropRight] = useState(initialCrop ? initialCrop.right * imageRect.width : 0)
  const [cropBottom, setCropBottom] = useState(initialCrop ? initialCrop.bottom * imageRect.height : 0)
  const [cropLeft, setCropLeft] = useState(initialCrop ? initialCrop.left * imageRect.width : 0)

  const draggingRef = useRef<DragEdge>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startCropRef = useRef({ top: 0, right: 0, bottom: 0, left: 0 })

  const MIN_CROP_SIZE = 20 // Minimum visible area in pixels

  const handleMouseDown = useCallback((edge: DragEdge, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    draggingRef.current = edge
    startPosRef.current = { x: e.clientX, y: e.clientY }
    startCropRef.current = { top: cropTop, right: cropRight, bottom: cropBottom, left: cropLeft }
  }, [cropTop, cropRight, cropBottom, cropLeft])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      const edge = draggingRef.current
      const maxW = imageRect.width - MIN_CROP_SIZE
      const maxH = imageRect.height - MIN_CROP_SIZE

      if (edge === 'top' || edge === 'top-left' || edge === 'top-right') {
        const newTop = Math.max(0, Math.min(maxH - startCropRef.current.bottom, startCropRef.current.top + dy))
        setCropTop(newTop)
      }
      if (edge === 'bottom' || edge === 'bottom-left' || edge === 'bottom-right') {
        const newBottom = Math.max(0, Math.min(maxH - startCropRef.current.top, startCropRef.current.bottom - dy))
        setCropBottom(newBottom)
      }
      if (edge === 'left' || edge === 'top-left' || edge === 'bottom-left') {
        const newLeft = Math.max(0, Math.min(maxW - startCropRef.current.right, startCropRef.current.left + dx))
        setCropLeft(newLeft)
      }
      if (edge === 'right' || edge === 'top-right' || edge === 'bottom-right') {
        const newRight = Math.max(0, Math.min(maxW - startCropRef.current.left, startCropRef.current.right - dx))
        setCropRight(newRight)
      }
    }

    const handleMouseUp = () => {
      draggingRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [imageRect.width, imageRect.height])

  const handleApply = useCallback(() => {
    // Convert pixel insets to clipPath coordinates relative to the image's own coordinate system
    // The clipPath is in the object's local coordinate space
    const scaleX = 1 // We'll pass fractions back and let the caller handle it
    const cropFractions = {
      left: cropLeft / imageRect.width,
      top: cropTop / imageRect.height,
      width: (imageRect.width - cropLeft - cropRight) / imageRect.width,
      height: (imageRect.height - cropTop - cropBottom) / imageRect.height,
    }
    onApply(cropFractions)
  }, [cropTop, cropRight, cropBottom, cropLeft, imageRect, onApply])

  // Visible crop area in screen coordinates
  const cropX = imageRect.left + cropLeft
  const cropY = imageRect.top + cropTop
  const cropW = imageRect.width - cropLeft - cropRight
  const cropH = imageRect.height - cropTop - cropBottom

  const handleSize = 8
  const halfHandle = handleSize / 2

  return (
    <div className="fixed inset-0 z-[90]" onContextMenu={(e) => e.preventDefault()}>
      {/* Dark overlay outside crop area - using 4 rectangles */}
      {/* Top strip */}
      <div
        className="absolute bg-black/50"
        style={{ left: imageRect.left, top: imageRect.top, width: imageRect.width, height: cropTop }}
      />
      {/* Bottom strip */}
      <div
        className="absolute bg-black/50"
        style={{ left: imageRect.left, top: cropY + cropH, width: imageRect.width, height: cropBottom }}
      />
      {/* Left strip */}
      <div
        className="absolute bg-black/50"
        style={{ left: imageRect.left, top: cropY, width: cropLeft, height: cropH }}
      />
      {/* Right strip */}
      <div
        className="absolute bg-black/50"
        style={{ left: cropX + cropW, top: cropY, width: cropRight, height: cropH }}
      />

      {/* Crop border */}
      <div
        className="absolute border-2 border-white pointer-events-none"
        style={{ left: cropX, top: cropY, width: cropW, height: cropH }}
      >
        {/* Rule of thirds grid lines */}
        <div className="absolute inset-0">
          <div className="absolute w-full border-t border-white/30" style={{ top: '33.33%' }} />
          <div className="absolute w-full border-t border-white/30" style={{ top: '66.66%' }} />
          <div className="absolute h-full border-l border-white/30" style={{ left: '33.33%' }} />
          <div className="absolute h-full border-l border-white/30" style={{ left: '66.66%' }} />
        </div>
      </div>

      {/* Edge handles */}
      {/* Top edge */}
      <div
        className="absolute cursor-ns-resize"
        style={{ left: cropX + halfHandle, top: cropY - halfHandle, width: cropW - handleSize, height: handleSize }}
        onMouseDown={(e) => handleMouseDown('top', e)}
      />
      {/* Bottom edge */}
      <div
        className="absolute cursor-ns-resize"
        style={{ left: cropX + halfHandle, top: cropY + cropH - halfHandle, width: cropW - handleSize, height: handleSize }}
        onMouseDown={(e) => handleMouseDown('bottom', e)}
      />
      {/* Left edge */}
      <div
        className="absolute cursor-ew-resize"
        style={{ left: cropX - halfHandle, top: cropY + halfHandle, width: handleSize, height: cropH - handleSize }}
        onMouseDown={(e) => handleMouseDown('left', e)}
      />
      {/* Right edge */}
      <div
        className="absolute cursor-ew-resize"
        style={{ left: cropX + cropW - halfHandle, top: cropY + halfHandle, width: handleSize, height: cropH - handleSize }}
        onMouseDown={(e) => handleMouseDown('right', e)}
      />

      {/* Corner handles - visible white squares */}
      {/* Top-left */}
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm cursor-nwse-resize shadow-sm"
        style={{ left: cropX - 6, top: cropY - 6 }}
        onMouseDown={(e) => handleMouseDown('top-left', e)}
      />
      {/* Top-right */}
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm cursor-nesw-resize shadow-sm"
        style={{ left: cropX + cropW - 6, top: cropY - 6 }}
        onMouseDown={(e) => handleMouseDown('top-right', e)}
      />
      {/* Bottom-left */}
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm cursor-nesw-resize shadow-sm"
        style={{ left: cropX - 6, top: cropY + cropH - 6 }}
        onMouseDown={(e) => handleMouseDown('bottom-left', e)}
      />
      {/* Bottom-right */}
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm cursor-nwse-resize shadow-sm"
        style={{ left: cropX + cropW - 6, top: cropY + cropH - 6 }}
        onMouseDown={(e) => handleMouseDown('bottom-right', e)}
      />

      {/* Action buttons */}
      <div
        className="absolute flex gap-2"
        style={{ left: cropX + cropW - 120, top: cropY + cropH + 12 }}
      >
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Apply Crop
        </button>
      </div>

      {/* Click outside to cancel */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onCancel}
      />
    </div>
  )
}
