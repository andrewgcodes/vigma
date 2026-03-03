import React, { useEffect, useRef } from 'react';
import { ContextMenuOption } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, options, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Keep menu within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - options.length * 30 - 20),
    zIndex: 300,
  };

  return (
    <div
      ref={ref}
      className="bg-[#2c2c2c] border border-[#3c3c3c] rounded-md shadow-lg py-1 min-w-[200px]"
      style={menuStyle}
    >
      {options.map((opt, i) => {
        if (opt.separator) {
          return <div key={i} className="border-t border-[#3c3c3c] my-1" />;
        }
        return (
          <button
            key={i}
            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between ${
              opt.disabled
                ? 'text-[#555] cursor-not-allowed'
                : 'text-[#d0d0d0] hover:bg-[#3c3c3c] cursor-pointer'
            }`}
            onClick={() => {
              if (!opt.disabled) {
                opt.action();
                onClose();
              }
            }}
            disabled={opt.disabled}
          >
            <span>{opt.label}</span>
            {opt.shortcut && <span className="text-[#888888] ml-4">{opt.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
