import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../../store/canvasStore';

interface MenuItem {
  label: string;
  shortcut?: string;
  action: string;
  disabled?: boolean;
  separator?: boolean;
}

export default function ContextMenu() {
  const { state, canvasRef } = useAppContext();
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const target = canvas.findTarget(e);
      const multiSelected = state.selectedObjectIds.length > 1;

      if (target && (target as unknown as Record<string, unknown>).customName !== undefined) {
        if (!canvas.getActiveObjects().includes(target)) {
          canvas.discardActiveObject();
          canvas.setActiveObject(target);
          canvas.requestRenderAll();
        }

        const items: MenuItem[] = [
          { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
          { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
          { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste', disabled: !state.clipboard },
          { label: '', action: '', separator: true },
          { label: 'Duplicate', shortcut: 'Ctrl+D', action: 'duplicate' },
          { label: 'Delete', shortcut: 'Del', action: 'delete' },
          { label: '', action: '', separator: true },
          { label: 'Bring to Front', shortcut: 'Ctrl+]', action: 'bring-front' },
          { label: 'Bring Forward', shortcut: ']', action: 'bring-forward' },
          { label: 'Send Backward', shortcut: '[', action: 'send-backward' },
          { label: 'Send to Back', shortcut: 'Ctrl+[', action: 'send-back' },
          { label: '', action: '', separator: true },
          ...(multiSelected ? [{ label: 'Group', shortcut: 'Ctrl+G', action: 'group' }] : []),
          ...(target.type === 'group' ? [{ label: 'Ungroup', shortcut: 'Ctrl+Shift+G', action: 'ungroup' }] : []),
          { label: '', action: '', separator: true },
          { label: target.selectable ? 'Lock' : 'Unlock', action: 'lock' },
        ];
        setMenu({ x: e.clientX, y: e.clientY, items });
      } else {
        const items: MenuItem[] = [
          { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste', disabled: !state.clipboard },
          { label: 'Select All', shortcut: 'Ctrl+A', action: 'select-all' },
          { label: '', action: '', separator: true },
          { label: 'Toggle Grid', shortcut: "Ctrl+'", action: 'toggle-grid' },
          { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: 'reset-zoom' },
          { label: 'Zoom to Fit', shortcut: 'Ctrl+1', action: 'zoom-fit' },
        ];
        setMenu({ x: e.clientX, y: e.clientY, items });
      }
    };

    const canvasEl = document.querySelector('.canvas-container');
    if (canvasEl) {
      canvasEl.addEventListener('contextmenu', handleContextMenu as EventListener);
    }
    return () => {
      if (canvasEl) {
        canvasEl.removeEventListener('contextmenu', handleContextMenu as EventListener);
      }
    };
  }, [canvasRef, state.selectedObjectIds, state.clipboard]);

  useEffect(() => {
    if (menu) {
      const handleClick = () => close();
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [menu, close]);

  const handleAction = (action: string) => {
    close();
    window.dispatchEvent(new CustomEvent('vigma:action', { detail: action }));
  };

  if (!menu) return null;

  return (
    <div
      className="fixed z-[200] bg-[#2c2c2c] border border-[#3c3c3c] rounded-md shadow-lg py-1 min-w-48"
      style={{ left: menu.x, top: menu.y }}
    >
      {menu.items.map((item, i) =>
        item.separator ? (
          <div key={i} className="border-t border-[#3c3c3c] my-1" />
        ) : (
          <button
            key={i}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#3c3c3c] cursor-pointer ${
              item.disabled ? 'text-[#666666] cursor-not-allowed' : 'text-[#d0d0d0]'
            }`}
            onClick={() => !item.disabled && handleAction(item.action)}
            disabled={item.disabled}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-[#888888] ml-4">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>
  );
}
