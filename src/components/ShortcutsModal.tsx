'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

export default function ShortcutsModal() {
  const { showShortcuts, setShowShortcuts } = useStore();

  if (!showShortcuts) return null;

  const shortcuts = [
    { category: 'Tools', items: [
      { keys: 'V', action: 'Select Tool' },
      { keys: 'H', action: 'Hand Tool (Pan)' },
      { keys: 'R', action: 'Rectangle' },
      { keys: 'O', action: 'Ellipse' },
      { keys: 'L', action: 'Line' },
      { keys: 'T', action: 'Text' },
      { keys: 'P', action: 'Pencil (Freehand)' },
      { keys: 'F', action: 'Frame' },
      { keys: 'Space', action: 'Hold to Pan' },
    ]},
    { category: 'Edit', items: [
      { keys: 'Ctrl+C', action: 'Copy' },
      { keys: 'Ctrl+X', action: 'Cut' },
      { keys: 'Ctrl+V', action: 'Paste' },
      { keys: 'Ctrl+D', action: 'Duplicate' },
      { keys: 'Ctrl+A', action: 'Select All' },
      { keys: 'Delete', action: 'Delete Selected' },
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Shift+Z', action: 'Redo' },
    ]},
    { category: 'Arrange', items: [
      { keys: 'Ctrl+G', action: 'Group' },
      { keys: 'Ctrl+Shift+G', action: 'Ungroup' },
      { keys: 'Ctrl+]', action: 'Bring Forward' },
      { keys: 'Ctrl+[', action: 'Send Backward' },
    ]},
    { category: 'Move', items: [
      { keys: 'Arrow Keys', action: 'Move 1px' },
      { keys: 'Shift+Arrow', action: 'Move 10px' },
    ]},
    { category: 'View', items: [
      { keys: 'Scroll', action: 'Zoom In/Out' },
      { keys: 'Ctrl+/', action: 'Toggle Shortcuts' },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-200/60 w-[540px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowShortcuts(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6 max-h-[calc(80vh-60px)]">
          <div className="grid grid-cols-2 gap-6">
            {shortcuts.map((group) => (
              <div key={group.category}>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.category}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <div key={item.action} className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-600">{item.action}</span>
                      <div className="flex gap-1">
                        {item.keys.split('+').map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-gray-300 text-[10px]">+</span>}
                            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 rounded border border-gray-200">{key}</kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
