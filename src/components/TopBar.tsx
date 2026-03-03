'use client'

import React, { useRef } from 'react'
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  Download, Upload, Menu, Grid3X3, Ruler, Magnet,
  LayoutDashboard, PanelLeft, PanelRight, RotateCcw,
  Save, FileJson, FileImage, FileCode
} from 'lucide-react'

interface TopBarProps {
  zoom: number
  canUndo: boolean
  canRedo: boolean
  showGrid: boolean
  showRulers: boolean
  snapToGrid: boolean
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onZoomToFit: () => void
  onToggleGrid: () => void
  onToggleRulers: () => void
  onToggleSnap: () => void
  onExport: (format: 'png' | 'svg' | 'jpg' | 'pdf' | 'json') => void
  onImportJSON: (json: string) => void
  onImportImage: (file: File) => void
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
  onClearCanvas: () => void
  onSaveProject: () => void
  leftPanelOpen: boolean
  rightPanelOpen: boolean
}

export default function TopBar({
  zoom,
  canUndo,
  canRedo,
  showGrid,
  showRulers,
  snapToGrid,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomToFit,
  onToggleGrid,
  onToggleRulers,
  onToggleSnap,
  onExport,
  onImportJSON,
  onImportImage,
  onToggleLeftPanel,
  onToggleRightPanel,
  onClearCanvas,
  onSaveProject,
  leftPanelOpen,
  rightPanelOpen,
}: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const [showExportMenu, setShowExportMenu] = React.useState(false)
  const [showViewMenu, setShowViewMenu] = React.useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onImportImage(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const json = ev.target?.result as string
        onImportJSON(json)
      }
      reader.readAsText(file)
    }
    if (jsonInputRef.current) jsonInputRef.current.value = ''
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-11 bg-white/90 backdrop-blur-xl border-b border-canvas-border z-50 flex items-center justify-between px-3">
      {/* Left section */}
      <div className="flex items-center gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-3 pr-3 border-r border-canvas-border">
          <div className="w-6 h-6 bg-gradient-to-br from-canvas-accent to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="text-sm font-semibold text-canvas-text tracking-tight">Vigma</span>
        </div>

        {/* Panel toggles */}
        <BarButton
          icon={<PanelLeft size={15} />}
          onClick={onToggleLeftPanel}
          active={leftPanelOpen}
          title="Toggle left panel"
        />

        <div className="w-px h-5 bg-canvas-border mx-1" />

        {/* Undo / Redo */}
        <BarButton icon={<Undo2 size={15} />} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" />
        <BarButton icon={<Redo2 size={15} />} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" />
      </div>

      {/* Center section - Zoom */}
      <div className="flex items-center gap-1 bg-canvas-bg rounded-lg px-1 py-0.5">
        <BarButton icon={<ZoomOut size={14} />} onClick={onZoomOut} title="Zoom out" />
        <button
          onClick={onZoomReset}
          className="text-xs font-medium text-canvas-text px-2 py-1 rounded-md hover:bg-canvas-hover min-w-[52px] text-center"
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <BarButton icon={<ZoomIn size={14} />} onClick={onZoomIn} title="Zoom in" />
        <BarButton icon={<Maximize2 size={14} />} onClick={onZoomToFit} title="Zoom to fit" />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* View options */}
        <div className="relative">
          <BarButton
            icon={<LayoutDashboard size={15} />}
            onClick={() => setShowViewMenu(!showViewMenu)}
            title="View options"
          />
          {showViewMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowViewMenu(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-panel-lg py-1 w-48">
                <MenuItem icon={<Grid3X3 size={14} />} label="Show Grid" active={showGrid} onClick={() => { onToggleGrid(); setShowViewMenu(false) }} shortcut="Ctrl+'" />
                <MenuItem icon={<Ruler size={14} />} label="Show Rulers" active={showRulers} onClick={() => { onToggleRulers(); setShowViewMenu(false) }} shortcut="Ctrl+R" />
                <MenuItem icon={<Magnet size={14} />} label="Snap to Grid" active={snapToGrid} onClick={() => { onToggleSnap(); setShowViewMenu(false) }} />
                <div className="h-px bg-canvas-border my-1" />
                <MenuItem icon={<RotateCcw size={14} />} label="Clear Canvas" onClick={() => { onClearCanvas(); setShowViewMenu(false) }} />
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-canvas-border mx-1" />

        {/* Import */}
        <BarButton
          icon={<Upload size={15} />}
          onClick={() => fileInputRef.current?.click()}
          title="Import image"
        />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        {/* Import JSON */}
        <BarButton
          icon={<FileJson size={15} />}
          onClick={() => jsonInputRef.current?.click()}
          title="Import JSON project"
        />
        <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleJSONImport} />

        <div className="w-px h-5 bg-canvas-border mx-1" />

        {/* Export menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-canvas-accent text-white text-xs font-medium rounded-lg hover:bg-canvas-accent-hover transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-panel-lg py-1 w-44">
                <ExportItem icon={<FileImage size={14} />} label="PNG (2x)" onClick={() => { onExport('png'); setShowExportMenu(false) }} />
                <ExportItem icon={<FileCode size={14} />} label="SVG" onClick={() => { onExport('svg'); setShowExportMenu(false) }} />
                <ExportItem icon={<FileImage size={14} />} label="JPG" onClick={() => { onExport('jpg'); setShowExportMenu(false) }} />
                <ExportItem icon={<FileImage size={14} />} label="PDF" onClick={() => { onExport('pdf'); setShowExportMenu(false) }} />
                <div className="h-px bg-canvas-border my-1" />
                <ExportItem icon={<FileJson size={14} />} label="Project (JSON)" onClick={() => { onExport('json'); setShowExportMenu(false) }} />
                <div className="h-px bg-canvas-border my-1" />
                <ExportItem icon={<Save size={14} />} label="Save to Browser" onClick={() => { onSaveProject(); setShowExportMenu(false) }} />
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-canvas-border mx-1" />

        <BarButton
          icon={<PanelRight size={15} />}
          onClick={onToggleRightPanel}
          active={rightPanelOpen}
          title="Toggle right panel"
        />
      </div>
    </div>
  )
}

function BarButton({ icon, onClick, disabled, active, title }: {
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-1.5 rounded-lg transition-colors
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-canvas-hover'}
        ${active ? 'bg-canvas-accent/10 text-canvas-accent' : 'text-canvas-text-secondary hover:text-canvas-text'}
      `}
      title={title}
    >
      {icon}
    </button>
  )
}

function MenuItem({ icon, label, active, onClick, shortcut }: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  shortcut?: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-canvas-text hover:bg-canvas-hover transition-colors"
    >
      <span className={active ? 'text-canvas-accent' : 'text-canvas-text-secondary'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {active !== undefined && (
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-canvas-accent' : 'bg-transparent'}`} />
      )}
      {shortcut && <span className="text-canvas-text-tertiary text-xxs">{shortcut}</span>}
    </button>
  )
}

function ExportItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-canvas-text hover:bg-canvas-hover transition-colors"
    >
      <span className="text-canvas-text-secondary">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
