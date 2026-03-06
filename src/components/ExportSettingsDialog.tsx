'use client'

import React, { useState } from 'react'
import { X, Download, Image, FileCode, Copy } from 'lucide-react'

// Feature 78: Export Settings Dialog with format options
interface ExportSettingsDialogProps {
  open: boolean
  onClose: () => void
  onExport: (format: string, scale: number, quality: number) => void
  onCopyAsPNG: () => void
  onCopyAsSVG: () => void
  onCopyAsCSS: () => void
}

export default function ExportSettingsDialog({ open, onClose, onExport, onCopyAsPNG, onCopyAsSVG, onCopyAsCSS }: ExportSettingsDialogProps) {
  const [format, setFormat] = useState('png')
  const [scale, setScale] = useState(2)
  const [quality, setQuality] = useState(0.92)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-canvas-border">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-canvas-accent" />
            <h2 className="text-lg font-semibold text-canvas-text">Export Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-canvas-hover text-canvas-text-secondary">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-canvas-text-secondary block mb-1.5">Format</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['png', 'jpg', 'svg', 'webp'].map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-1.5 text-xs rounded-lg border transition-colors ${
                    format === f
                      ? 'bg-canvas-accent text-white border-canvas-accent'
                      : 'bg-white text-canvas-text-secondary border-canvas-border hover:bg-canvas-hover'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-canvas-text-secondary block mb-1.5">Scale</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-canvas-accent"
              />
              <span className="text-xs text-canvas-text w-8 text-right">{scale}x</span>
            </div>
          </div>
          {(format === 'jpg' || format === 'webp') && (
            <div>
              <label className="text-xs font-medium text-canvas-text-secondary block mb-1.5">Quality</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="flex-1 accent-canvas-accent"
                />
                <span className="text-xs text-canvas-text w-10 text-right">{Math.round(quality * 100)}%</span>
              </div>
            </div>
          )}
          <button
            onClick={() => { onExport(format, scale, quality); onClose() }}
            className="w-full py-2.5 bg-canvas-accent text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Image size={16} />
            Export as {format.toUpperCase()}
          </button>
          <div className="border-t border-canvas-border pt-3">
            <label className="text-xs font-medium text-canvas-text-secondary block mb-2">Copy to Clipboard</label>
            <div className="flex gap-2">
              <button onClick={() => { onCopyAsPNG(); onClose() }} className="flex-1 py-2 text-xs rounded-lg border border-canvas-border hover:bg-canvas-hover flex items-center justify-center gap-1.5 text-canvas-text-secondary">
                <Copy size={12} /> PNG
              </button>
              <button onClick={() => { onCopyAsSVG(); onClose() }} className="flex-1 py-2 text-xs rounded-lg border border-canvas-border hover:bg-canvas-hover flex items-center justify-center gap-1.5 text-canvas-text-secondary">
                <FileCode size={12} /> SVG
              </button>
              <button onClick={() => { onCopyAsCSS(); onClose() }} className="flex-1 py-2 text-xs rounded-lg border border-canvas-border hover:bg-canvas-hover flex items-center justify-center gap-1.5 text-canvas-text-secondary">
                <FileCode size={12} /> CSS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
