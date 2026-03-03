import React from 'react';

interface OpacitySectionProps {
  value: number;
  onChange: (value: number) => void;
}

export default function OpacitySection({ value, onChange }: OpacitySectionProps) {
  const percent = Math.round(value * 100);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#a0a0a0] min-w-[50px]">Opacity</span>
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="flex-1 h-1 accent-[#7c5cfc]"
        />
        <input
          type="number"
          value={percent}
          onChange={(e) => onChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)}
          onKeyDown={(e) => e.stopPropagation()}
          className="w-12 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 focus:border-[#7c5cfc] focus:outline-none text-center"
          min={0}
          max={100}
        />
      </div>
    </div>
  );
}
