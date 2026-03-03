'use client';

import React from 'react';
import { useDesignStore } from '@/store/useDesignStore';
import {
  Copy, Clipboard, Trash2, Group, Ungroup,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  FlipHorizontal, FlipVertical, Lock, Unlock,
  Eye, EyeOff, Scissors,
} from 'lucide-react';

interface ContextMenuProps {
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onLock: () => void;
}

export default function ContextMenu({
  onCopy, onPaste, onDuplicate, onDelete,
  onGroup, onUngroup,
  onBringForward, onSendBackward, onBringToFront, onSendToBack,
  onFlipH, onFlipV, onLock,
}: ContextMenuProps) {
  const position = useDesignStore((s) => s.contextMenuPosition);
  const setPosition = useDesignStore((s) => s.setContextMenuPosition);

  if (!position) return null;

  const handleAction = (action: () => void) => {
    action();
    setPosition(null);
  };

  const menuItems = [
    { label: 'Copy', icon: <Copy size={14} />, action: onCopy, shortcut: 'Cmd+C' },
    { label: 'Paste', icon: <Clipboard size={14} />, action: onPaste, shortcut: 'Cmd+V' },
    { label: 'Duplicate', icon: <Copy size={14} />, action: onDuplicate, shortcut: 'Cmd+D' },
    { type: 'separator' as const },
    { label: 'Bring to Front', icon: <ChevronsUp size={14} />, action: onBringToFront, shortcut: 'Cmd+Shift+]' },
    { label: 'Bring Forward', icon: <ArrowUp size={14} />, action: onBringForward, shortcut: 'Cmd+]' },
    { label: 'Send Backward', icon: <ArrowDown size={14} />, action: onSendBackward, shortcut: 'Cmd+[' },
    { label: 'Send to Back', icon: <ChevronsDown size={14} />, action: onSendToBack, shortcut: 'Cmd+Shift+[' },
    { type: 'separator' as const },
    { label: 'Group', icon: <Group size={14} />, action: onGroup, shortcut: 'Cmd+G' },
    { label: 'Ungroup', icon: <Ungroup size={14} />, action: onUngroup, shortcut: 'Cmd+Shift+G' },
    { type: 'separator' as const },
    { label: 'Flip Horizontal', icon: <FlipHorizontal size={14} />, action: onFlipH },
    { label: 'Flip Vertical', icon: <FlipVertical size={14} />, action: onFlipV },
    { label: 'Lock/Unlock', icon: <Lock size={14} />, action: onLock },
    { type: 'separator' as const },
    { label: 'Delete', icon: <Trash2 size={14} />, action: onDelete, shortcut: 'Del', danger: true },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={() => setPosition(null)} />
      <div
        className="fixed z-50 bg-white/95 backdrop-blur-xl rounded-xl shadow-dropdown border border-canvas-border p-1 min-w-52"
        style={{ left: position.x, top: position.y }}
      >
        {menuItems.map((item, i) => {
          if ('type' in item && item.type === 'separator') {
            return <div key={i} className="h-px bg-canvas-border my-1" />;
          }
          const menuItem = item as { label: string; icon: React.ReactNode; action: () => void; shortcut?: string; danger?: boolean };
          return (
            <button
              key={i}
              onClick={() => handleAction(menuItem.action)}
              className={`flex items-center gap-3 w-full px-3 py-1.5 rounded-lg text-xs text-left transition-colors ${
                menuItem.danger
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-canvas-text hover:bg-canvas-hover'
              }`}
            >
              <span className="text-canvas-text-secondary">{menuItem.icon}</span>
              <span className="flex-1">{menuItem.label}</span>
              {menuItem.shortcut && (
                <span className="text-2xs text-canvas-text-secondary">{menuItem.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
