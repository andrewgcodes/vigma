'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Copy, Clipboard, Scissors, Trash2, Lock, Unlock,
  ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown,
  FlipHorizontal, FlipVertical, Group, Ungroup,
  Eye, EyeOff, CopyPlus, Combine, Minus, Merge, X
} from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  visible: boolean
  onClose: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onDuplicate: () => void
  onDelete: () => void
  onSelectAll: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onGroup: () => void
  onUngroup: () => void
  onFlipH: () => void
  onFlipV: () => void
  onLock: () => void
  onBooleanUnion?: () => void
  onBooleanSubtract?: () => void
  onBooleanIntersect?: () => void
  onBooleanExclude?: () => void
  onMask?: () => void
  onRemoveMask?: () => void
  hasSelection: boolean
  isLocked: boolean
  multipleSelected?: boolean
}

export default function ContextMenu({
  x, y, visible, onClose,
  onCopy, onCut, onPaste, onDuplicate, onDelete, onSelectAll,
  onBringToFront, onSendToBack, onBringForward, onSendBackward,
  onGroup, onUngroup, onFlipH, onFlipV, onLock,
  onBooleanUnion, onBooleanSubtract, onBooleanIntersect, onBooleanExclude,
  onMask, onRemoveMask,
  hasSelection, isLocked, multipleSelected,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!visible) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visible, onClose])

  // Measure actual menu height and adjust position before paint (useLayoutEffect avoids flash)
  useLayoutEffect(() => {
    if (!visible || !menuRef.current) return
    const menuRect = menuRef.current.getBoundingClientRect()
    const adjustedX = Math.min(x, window.innerWidth - menuRect.width - 8)
    const adjustedY = Math.min(y, window.innerHeight - menuRect.height - 8)
    setAdjustedPos({ x: Math.max(0, adjustedX), y: Math.max(0, adjustedY) })
  }, [visible, x, y, hasSelection, multipleSelected, isLocked])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="context-menu fixed z-[100] bg-white rounded-xl shadow-panel-lg py-1 w-52 border border-canvas-border/50"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {hasSelection && (
        <>
          <CtxItem icon={<Copy size={14} />} label="Copy" shortcut="Ctrl+C" onClick={() => { onCopy(); onClose() }} />
          <CtxItem icon={<Scissors size={14} />} label="Cut" shortcut="Ctrl+X" onClick={() => { onCut(); onClose() }} />
          <CtxItem icon={<CopyPlus size={14} />} label="Duplicate" shortcut="Ctrl+D" onClick={() => { onDuplicate(); onClose() }} />
          <Divider />
        </>
      )}
      <CtxItem icon={<Clipboard size={14} />} label="Paste" shortcut="Ctrl+V" onClick={() => { onPaste(); onClose() }} />
      <CtxItem label="Select All" shortcut="Ctrl+A" onClick={() => { onSelectAll(); onClose() }} />
      {hasSelection && (
        <>
          <Divider />
          <CtxItem icon={<ArrowUpToLine size={14} />} label="Bring to Front" shortcut="Ctrl+]" onClick={() => { onBringToFront(); onClose() }} />
          <CtxItem icon={<ArrowUp size={14} />} label="Bring Forward" onClick={() => { onBringForward(); onClose() }} />
          <CtxItem icon={<ArrowDown size={14} />} label="Send Backward" onClick={() => { onSendBackward(); onClose() }} />
          <CtxItem icon={<ArrowDownToLine size={14} />} label="Send to Back" shortcut="Ctrl+[" onClick={() => { onSendToBack(); onClose() }} />
          <Divider />
          <CtxItem icon={<Group size={14} />} label="Group" shortcut="Ctrl+G" onClick={() => { onGroup(); onClose() }} />
          <CtxItem icon={<Ungroup size={14} />} label="Ungroup" shortcut="Ctrl+Shift+G" onClick={() => { onUngroup(); onClose() }} />
          <Divider />
          <CtxItem icon={<FlipHorizontal size={14} />} label="Flip Horizontal" onClick={() => { onFlipH(); onClose() }} />
          <CtxItem icon={<FlipVertical size={14} />} label="Flip Vertical" onClick={() => { onFlipV(); onClose() }} />
          {multipleSelected && (
            <>
              <Divider />
              <CtxItem icon={<Combine size={14} />} label="Union" onClick={() => { onBooleanUnion?.(); onClose() }} />
              <CtxItem icon={<Minus size={14} />} label="Subtract" onClick={() => { onBooleanSubtract?.(); onClose() }} />
              <CtxItem icon={<Merge size={14} />} label="Intersect" onClick={() => { onBooleanIntersect?.(); onClose() }} />
              <CtxItem icon={<X size={14} />} label="Exclude" onClick={() => { onBooleanExclude?.(); onClose() }} />
            </>
          )}
          <Divider />
          <CtxItem icon={<Eye size={14} />} label="Use as Mask" onClick={() => { onMask?.(); onClose() }} />
          <CtxItem icon={<EyeOff size={14} />} label="Remove Mask" onClick={() => { onRemoveMask?.(); onClose() }} />
          <Divider />
          <CtxItem
            icon={isLocked ? <Unlock size={14} /> : <Lock size={14} />}
            label={isLocked ? 'Unlock' : 'Lock'}
            onClick={() => { onLock(); onClose() }}
          />
          <Divider />
          <CtxItem
            icon={<Trash2 size={14} />}
            label="Delete"
            shortcut="Del"
            onClick={() => { onDelete(); onClose() }}
            danger
          />
        </>
      )}
    </div>
  )
}

function CtxItem({ icon, label, shortcut, onClick, danger }: {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-canvas-text hover:bg-canvas-hover'
      }`}
    >
      {icon && <span className={danger ? 'text-red-400' : 'text-canvas-text-secondary'}>{icon}</span>}
      {!icon && <span className="w-3.5" />}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-canvas-text-tertiary text-xxs">{shortcut}</span>}
    </button>
  )
}

function Divider() {
  return <div className="h-px bg-canvas-border my-1" />
}
