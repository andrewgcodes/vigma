import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PRESET_COLORS } from '../../utils/defaultStyles';

interface ColorPickerProps {
  color: string;
  opacity?: number;
  onChange: (color: string, opacity?: number) => void;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hexToHSV(hex: string): { h: number; s: number; v: number } {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max !== min) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const hi = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (hi) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorPicker({ color, opacity = 100, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hsv, setHSV] = useState(() => hexToHSV(color || '#ffffff'));
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [hexInput, setHexInput] = useState(color || '#ffffff');
  const popoverRef = useRef<HTMLDivElement>(null);
  const satRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSat = useRef(false);
  const isDraggingHue = useRef(false);

  useEffect(() => {
    if (color) {
      const newHsv = hexToHSV(color);
      setHSV(newHsv);
      setHexInput(color);
    }
  }, [color]);

  useEffect(() => {
    setLocalOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateColor = useCallback((newHsv: { h: number; s: number; v: number }, newOpacity?: number) => {
    const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHSV(newHsv);
    setHexInput(hex);
    onChange(hex, newOpacity ?? localOpacity);
  }, [onChange, localOpacity]);

  const handleSatMouseDown = (e: React.MouseEvent) => {
    isDraggingSat.current = true;
    handleSatMove(e);
    const handleMouseMove = (ev: MouseEvent) => handleSatMove(ev as unknown as React.MouseEvent);
    const handleMouseUp = () => {
      isDraggingSat.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSatMove = (e: React.MouseEvent | MouseEvent) => {
    if (!satRef.current) return;
    const rect = satRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, ((e as MouseEvent).clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, ((e as MouseEvent).clientY - rect.top) / rect.height));
    const newHsv = { h: hsv.h, s: x * 100, v: (1 - y) * 100 };
    updateColor(newHsv);
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    isDraggingHue.current = true;
    handleHueMove(e);
    const handleMouseMove = (ev: MouseEvent) => handleHueMove(ev as unknown as React.MouseEvent);
    const handleMouseUp = () => {
      isDraggingHue.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleHueMove = (e: React.MouseEvent | MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, ((e as MouseEvent).clientX - rect.left) / rect.width));
    const newHsv = { ...hsv, h: x * 360 };
    updateColor(newHsv);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const newHsv = hexToHSV(val);
      setHSV(newHsv);
      onChange(val, localOpacity);
    }
  };

  const handleOpacityChange = (newOp: number) => {
    setLocalOpacity(newOp);
    const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
    onChange(hex, newOp);
  };

  const hueColor = hsvToHex(hsv.h, 100, 100);

  return (
    <div className="relative" ref={popoverRef}>
      <div
        className="w-6 h-6 rounded border border-[#3c3c3c] cursor-pointer"
        style={{ backgroundColor: color || '#ffffff' }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="absolute top-8 left-0 z-[100] bg-[#2c2c2c] border border-[#3c3c3c] rounded-lg p-3 shadow-xl w-[220px]">
          {/* Saturation/Value gradient */}
          <div
            ref={satRef}
            className="w-[196px] h-[150px] rounded cursor-crosshair relative mb-2"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
            }}
            onMouseDown={handleSatMouseDown}
          >
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
              }}
            />
          </div>
          {/* Hue slider */}
          <div
            ref={hueRef}
            className="w-[196px] h-3 rounded cursor-pointer relative mb-2"
            style={{
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
            onMouseDown={handleHueMouseDown}
          >
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2 top-0 pointer-events-none"
              style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
          {/* Hex input */}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              onKeyDown={(e) => e.stopPropagation()}
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-2 focus:border-[#7c5cfc] focus:outline-none"
              maxLength={7}
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={Math.round(localOpacity)}
                onChange={(e) => handleOpacityChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-12 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 focus:border-[#7c5cfc] focus:outline-none"
                min={0}
                max={100}
              />
              <span className="text-xs text-[#666]">%</span>
            </div>
          </div>
          {/* Presets */}
          <div className="grid grid-cols-10 gap-1">
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                className="w-4 h-4 rounded-sm cursor-pointer border border-[#3c3c3c] hover:scale-125 transition-transform"
                style={{ backgroundColor: c }}
                onClick={() => {
                  const newHsv = hexToHSV(c);
                  setHSV(newHsv);
                  setHexInput(c);
                  onChange(c, localOpacity);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
