'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const presetColors = [
  '#000000', '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
  '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8',
];

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHexChange = useCallback((value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  }, [onChange]);

  return (
    <div className="color-picker-wrapper" ref={ref}>
      {label && <span className="color-picker-label">{label}</span>}
      <button
        className="color-swatch"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="color-picker-popover">
          <div className="color-presets">
            {presetColors.map((c) => (
              <button
                key={c}
                className={`color-preset ${c === color ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  onChange(c);
                  setHexInput(c);
                }}
              />
            ))}
          </div>
          <div className="color-hex-input">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              maxLength={7}
            />
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => {
              onChange(e.target.value);
              setHexInput(e.target.value);
            }}
            className="color-native-picker"
          />
        </div>
      )}
    </div>
  );
}
