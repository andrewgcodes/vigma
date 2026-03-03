import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolButtonProps {
  icon: LucideIcon;
  tooltip: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: number;
}

export default function ToolButton({ icon: Icon, tooltip, active, disabled, onClick, size = 20 }: ToolButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
          active ? 'bg-[#7c5cfc] text-white' : 'text-[#a0a0a0] hover:bg-[#3c3c3c]'
        } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon size={size} />
      </button>
      {showTooltip && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-[#1e1e1e] text-white text-[11px] px-2 py-1 rounded whitespace-nowrap z-50 border border-[#3c3c3c]">
          {tooltip}
        </div>
      )}
    </div>
  );
}
