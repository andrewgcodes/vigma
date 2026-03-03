import React from 'react';

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: number;
}

export default function ToolButton({ icon, tooltip, active = false, disabled = false, onClick, size = 36 }: ToolButtonProps) {
  return (
    <button
      className={`flex items-center justify-center rounded-md transition-colors relative group
        ${active ? 'bg-[#7c5cfc] text-white' : 'text-[#a0a0a0] hover:bg-[#3c3c3c]'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ width: size, height: size }}
      onClick={disabled ? undefined : onClick}
      title={tooltip}
    >
      {icon}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1e1e1e] text-white text-[11px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-[#3c3c3c]">
        {tooltip}
      </div>
    </button>
  );
}
