import React, { useState, useEffect, useCallback } from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function NumberInput({ label, value, onChange, min, max, step = 1, className = '' }: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(Math.round(value * 10) / 10));
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    let num = parseFloat(localValue);
    if (isNaN(num)) num = value;
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    setLocalValue(String(Math.round(num * 10) / 10));
    onChange(num);
  }, [localValue, value, min, max, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    e.stopPropagation();
  }, []);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[11px] text-[#a0a0a0] font-medium">{label}</label>
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 w-full focus:border-[#7c5cfc] focus:outline-none"
      />
    </div>
  );
}
