import React, { useState, useEffect } from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export default function NumberInput({ label, value, onChange, min, max, step = 1, suffix }: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(Math.round(value * 10) / 10));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    let num = parseFloat(localValue);
    if (isNaN(num)) {
      setLocalValue(String(value));
      return;
    }
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    setLocalValue(String(Math.round(num * 10) / 10));
    onChange(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-[#a0a0a0] min-w-[14px]">{label}</span>
      <div className="relative flex-1">
        <input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 focus:border-[#7c5cfc] focus:outline-none"
        />
        {suffix && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-[#666]">{suffix}</span>
        )}
      </div>
    </div>
  );
}
