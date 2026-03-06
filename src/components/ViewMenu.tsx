'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useDesignStore } from '@/store/useDesignStore'
import {
  Eye, Grid3X3, Ruler, Map, Info, Keyboard, Moon, Sun,
  Maximize, Columns, ArrowDownToLine, ArrowRightToLine,
  BarChart3, Crosshair, MousePointer, Magnet, PanelBottom
} from 'lucide-react'

// Feature 89: View Menu with toggles for all view options
interface ViewMenuProps {
  open: boolean
  onClose: () => void
  onToggleGrid: () => void
  onToggleRulers: () => void
  onToggleGuides: () => void
  onZoomToFit: () => void
  onZoomToFitWidth: () => void
  onZoomToFitHeight: () => void
  onResetZoom: () => void
  onOpenGridSettings: () => void
  onOpenCanvasBg: () => void
  gridEnabled: boolean
  rulersEnabled: boolean
  guidesEnabled: boolean
}

export default function ViewMenu({
  open, onClose, onToggleGrid, onToggleRulers, onToggleGuides,
  onZoomToFit, onZoomToFitWidth, onZoomToFitHeight, onResetZoom,
  onOpenGridSettings, onOpenCanvasBg,
  gridEnabled, rulersEnabled, guidesEnabled
}: ViewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    darkMode, toggleDarkMode,
    showMinimap, toggleMinimap,
    showObjectInfo, toggleObjectInfo,
    showKeyboardShortcuts, setShowKeyboardShortcuts,
    showWorkspaceInfo, toggleWorkspaceInfo,
    showStatusBar, toggleStatusBar,
    showSelectionDimensions, toggleSelectionDimensions,
    snapToObjects, toggleSnapToObjects,
    showDistanceGuides, toggleDistanceGuides,
    autoSelectAfterCreate, toggleAutoSelectAfterCreate,
  } = useDesignStore()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  if (!open) return null

  const MenuItem = ({ icon, label, checked, onClick, shortcut }: { icon: React.ReactNode; label: string; checked?: boolean; onClick: () => void; shortcut?: string }) => (
    <button
      onClick={() => { onClick(); }}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-canvas-text hover:bg-canvas-hover rounded-lg transition-colors"
    >
      <span className="w-4 text-canvas-text-secondary">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[10px] text-canvas-text-tertiary">{shortcut}</span>}
      {checked !== undefined && (
        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? 'bg-canvas-accent border-canvas-accent' : 'border-canvas-border'}`}>
          {checked && <span className="text-white text-[8px]">&#10003;</span>}
        </div>
      )}
    </button>
  )

  const Divider = () => <div className="border-t border-canvas-border my-1" />

  return (
    <div ref={menuRef} className="fixed top-10 left-16 z-[9999] bg-white rounded-xl shadow-2xl border border-canvas-border w-56 py-1.5 overflow-hidden">
      <div className="px-3 py-1 text-[10px] font-semibold text-canvas-text-tertiary uppercase tracking-wider">Display</div>
      <MenuItem icon={<Grid3X3 size={14} />} label="Show Grid" checked={gridEnabled} onClick={onToggleGrid} />
      <MenuItem icon={<Ruler size={14} />} label="Show Rulers" checked={rulersEnabled} onClick={onToggleRulers} />
      <MenuItem icon={<Eye size={14} />} label="Show Guides" checked={guidesEnabled} onClick={onToggleGuides} />
      <MenuItem icon={<Map size={14} />} label="Show Minimap" checked={showMinimap} onClick={toggleMinimap} />
      <MenuItem icon={<Info size={14} />} label="Object Info Overlay" checked={showObjectInfo} onClick={toggleObjectInfo} />
      <MenuItem icon={<PanelBottom size={14} />} label="Status Bar" checked={showStatusBar} onClick={toggleStatusBar} />
      <MenuItem icon={<Crosshair size={14} />} label="Selection Dimensions" checked={showSelectionDimensions} onClick={toggleSelectionDimensions} />
      <MenuItem icon={<Columns size={14} />} label="Distance Guides" checked={showDistanceGuides} onClick={toggleDistanceGuides} />

      <Divider />
      <div className="px-3 py-1 text-[10px] font-semibold text-canvas-text-tertiary uppercase tracking-wider">Behavior</div>
      <MenuItem icon={<Magnet size={14} />} label="Snap to Objects" checked={snapToObjects} onClick={toggleSnapToObjects} />
      <MenuItem icon={<MousePointer size={14} />} label="Auto-select on Create" checked={autoSelectAfterCreate} onClick={toggleAutoSelectAfterCreate} />

      <Divider />
      <div className="px-3 py-1 text-[10px] font-semibold text-canvas-text-tertiary uppercase tracking-wider">Zoom</div>
      <MenuItem icon={<Maximize size={14} />} label="Zoom to Fit" onClick={onZoomToFit} shortcut="Ctrl+1" />
      <MenuItem icon={<ArrowRightToLine size={14} />} label="Fit Width" onClick={onZoomToFitWidth} />
      <MenuItem icon={<ArrowDownToLine size={14} />} label="Fit Height" onClick={onZoomToFitHeight} />
      <MenuItem icon={<Maximize size={14} />} label="Reset Zoom" onClick={onResetZoom} shortcut="Ctrl+0" />

      <Divider />
      <div className="px-3 py-1 text-[10px] font-semibold text-canvas-text-tertiary uppercase tracking-wider">Settings</div>
      <MenuItem icon={<Grid3X3 size={14} />} label="Grid Settings..." onClick={() => { onOpenGridSettings(); onClose() }} />
      <MenuItem icon={<Eye size={14} />} label="Canvas Background..." onClick={() => { onOpenCanvasBg(); onClose() }} />
      <MenuItem icon={darkMode ? <Sun size={14} /> : <Moon size={14} />} label={darkMode ? 'Light Mode' : 'Dark Mode'} onClick={toggleDarkMode} />
      <MenuItem icon={<Keyboard size={14} />} label="Keyboard Shortcuts" onClick={() => { setShowKeyboardShortcuts(true); onClose() }} shortcut="?" />
      <MenuItem icon={<BarChart3 size={14} />} label="Workspace Info" onClick={() => { toggleWorkspaceInfo(); onClose() }} />
    </div>
  )
}
