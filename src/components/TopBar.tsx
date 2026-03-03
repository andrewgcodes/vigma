'use client'

import React, { useRef } from 'react'
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  Download, Upload, Menu, Grid3X3, Ruler, Magnet,
  LayoutDashboard, PanelLeft, PanelRight, RotateCcw,
  Save, FileJson, FileImage, FileCode, Info, Share2, Users, Copy, Check, LogOut, MessageSquare, HelpCircle, Cloud, Loader2
} from 'lucide-react'
import type { RemoteUser } from '@/lib/collaboration'

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
  saveStatus?: 'saved' | 'saving' | 'just-saved'
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  // Collaboration
  isCollaborating?: boolean
  roomId?: string | null
  remoteUsers?: RemoteUser[]
  connectionStatus?: 'connecting' | 'connected' | 'disconnected'
  onShare?: () => void
  onLeaveRoom?: () => void
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
  saveStatus = 'saved',
  leftPanelOpen,
  rightPanelOpen,
  isCollaborating,
  roomId,
  remoteUsers = [],
  connectionStatus = 'disconnected',
  onShare,
  onLeaveRoom,
}: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const [showExportMenu, setShowExportMenu] = React.useState(false)
  const [showViewMenu, setShowViewMenu] = React.useState(false)
  const [showInfoTooltip, setShowInfoTooltip] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopyLink = () => {
    if (roomId) {
      const url = `${window.location.origin}${window.location.pathname}#room=${roomId}`
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

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
          {/* Save status indicator */}
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all duration-300 ${
            saveStatus === 'just-saved'
              ? 'text-green-600 bg-green-50'
              : saveStatus === 'saving'
              ? 'text-amber-600 bg-amber-50'
              : 'text-canvas-text-tertiary'
          }`}>
            {saveStatus === 'just-saved' ? (
              <><Check size={11} className="text-green-500" /><span>Saved</span></>
            ) : saveStatus === 'saving' ? (
              <><Loader2 size={11} className="animate-spin" /><span>Saving...</span></>
            ) : (
              <><Cloud size={11} /><span>Saved</span></>
            )}
          </div>
          <div className="relative" onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
            <Info size={13} className="text-canvas-text-tertiary hover:text-canvas-text-secondary cursor-pointer transition-colors" />
            {showInfoTooltip && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                <div className="px-3 py-2.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg tooltip-content">
                  <p>Made with <span className="text-red-400">❤️</span> by <a href="https://devin.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">Devin</a></p>
                  <div className="flex gap-3 mt-1.5 pt-1.5 border-t border-gray-700">
                    <a href="https://forms.gle/oNS1Q1pnR8GTjJvYA" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline flex items-center gap-1"><MessageSquare size={10} />Feedback</a>
                    <a href="https://twitter.com/itsandrewgao" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">@itsandrewgao</a>
                  </div>
                  <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </div>
            )}
          </div>
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

        {/* Collaboration section */}
        {isCollaborating && roomId ? (
          <div className="flex items-center gap-1.5 mr-1">
            {/* Online users avatars */}
            <div className="flex items-center -space-x-1.5">
              {remoteUsers.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white shadow-sm"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0)}
                </div>
              ))}
              {remoteUsers.length > 5 && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium bg-gray-200 text-gray-600 border-2 border-white">
                  +{remoteUsers.length - 5}
                </div>
              )}
            </div>
            <span className="text-[10px] text-canvas-text-tertiary flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
              {connectionStatus === 'connecting' ? 'Connecting...' : `${remoteUsers.length + 1} online`}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              title="Copy room link"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={onLeaveRoom}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              title="Leave collaboration room"
            >
              <LogOut size={12} />
              Leave
            </button>
          </div>
        ) : (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors mr-1"
            title="Start a collaboration room"
          >
            <Share2 size={14} />
            Share
          </button>
        )}

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
