'use client';

import React from 'react';
import {
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Group,
  Ungroup,
  Lock,
  Unlock,
} from 'lucide-react';
import { canvasEngine } from '@/lib/canvas-engine';
import { useCanvasStore } from '@/store/canvas-store';

interface ContextMenuProps {
  x: number;
  y: number;
  hasTarget: boolean;
  onClose: () => void;
}

export default function ContextMenu({ x, y, hasTarget, onClose }: ContextMenuProps) {
  const { selectedObjectIds } = useCanvasStore();
  const hasMultiple = selectedObjectIds.length > 1;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  // Adjust position to keep menu on screen
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 300),
    zIndex: 9999,
  };

  return (
    <div className="context-menu" style={menuStyle} onClick={(e) => e.stopPropagation()}>
      {hasTarget ? (
        <>
          <button onClick={() => handleAction(() => canvasEngine.copyToClipboard())}>
            <Copy size={14} /> Copy
            <span className="shortcut">Ctrl+C</span>
          </button>
          <button onClick={() => handleAction(() => canvasEngine.duplicateSelected())}>
            <Scissors size={14} /> Duplicate
            <span className="shortcut">Ctrl+D</span>
          </button>
          <button onClick={() => handleAction(() => canvasEngine.pasteFromClipboard())}>
            <Clipboard size={14} /> Paste
            <span className="shortcut">Ctrl+V</span>
          </button>
          <div className="context-menu-divider" />
          <button onClick={() => handleAction(() => canvasEngine.bringToFront())}>
            <ArrowUpToLine size={14} /> Bring to Front
          </button>
          <button onClick={() => handleAction(() => canvasEngine.bringForward())}>
            <ArrowUp size={14} /> Bring Forward
          </button>
          <button onClick={() => handleAction(() => canvasEngine.sendBackward())}>
            <ArrowDown size={14} /> Send Backward
          </button>
          <button onClick={() => handleAction(() => canvasEngine.sendToBack())}>
            <ArrowDownToLine size={14} /> Send to Back
          </button>
          <div className="context-menu-divider" />
          {hasMultiple && (
            <button onClick={() => handleAction(() => canvasEngine.groupSelected())}>
              <Group size={14} /> Group
              <span className="shortcut">Ctrl+G</span>
            </button>
          )}
          <button onClick={() => handleAction(() => canvasEngine.ungroupSelected())}>
            <Ungroup size={14} /> Ungroup
            <span className="shortcut">Ctrl+Shift+G</span>
          </button>
          <div className="context-menu-divider" />
          <button onClick={() => {
            const obj = canvasEngine.canvas?.getActiveObject();
            if (obj) {
              handleAction(() => {
                const typed = obj as typeof obj & { id?: string };
                if (typed.id) canvasEngine.toggleObjectLock(typed.id);
              });
            }
          }}>
            {canvasEngine.canvas?.getActiveObject()?.selectable === false
              ? <><Unlock size={14} /> Unlock</>
              : <><Lock size={14} /> Lock</>
            }
          </button>
          <div className="context-menu-divider" />
          <button className="danger" onClick={() => handleAction(() => canvasEngine.deleteSelected())}>
            <Trash2 size={14} /> Delete
            <span className="shortcut">Del</span>
          </button>
        </>
      ) : (
        <>
          <button onClick={() => handleAction(() => canvasEngine.pasteFromClipboard())}>
            <Clipboard size={14} /> Paste
            <span className="shortcut">Ctrl+V</span>
          </button>
          <button onClick={() => handleAction(() => canvasEngine.selectAll())}>
            Select All
            <span className="shortcut">Ctrl+A</span>
          </button>
        </>
      )}
    </div>
  );
}
