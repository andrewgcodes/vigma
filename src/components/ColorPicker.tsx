'use client';

import React, { useState, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const presetColors = [
  '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0',
  '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b',
  '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b',
];

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = useCallback((c: string) => {
    onChange(c);
  }, [onChange]);

  return (
    <div className="relative">
      {label && (
        <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-1 block">
          {label}
        </span>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full"
      >
        <div
          className="w-6 h-6 rounded border border-canvas-border shadow-sm cursor-pointer"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-canvas-text font-mono">{color}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-dropdown p-3 w-56">
            <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-canvas-text-secondary">#</span>
              <HexColorInput
                color={color}
                onChange={onChange}
                className="w-full text-xs font-mono px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent"
                prefixed={false}
              />
            </div>
            <div className="mt-3 grid grid-cols-10 gap-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => handlePresetClick(c)}
                  className={`w-4 h-4 rounded-sm border cursor-pointer transition-transform hover:scale-125 ${
                    c === color ? 'border-canvas-accent ring-1 ring-canvas-accent' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
