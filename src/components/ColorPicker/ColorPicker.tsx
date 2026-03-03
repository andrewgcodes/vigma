import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PRESET_COLORS } from '../../utils/defaultStyles';

interface ColorPickerProps {
  color: string;
  opacity?: number;
  onChange: (color: string, opacity?: number) => void;
}

function hexToHSV(hex: string): { h: number; s: number; v: number } {
  const h6 = hex.replace('#', '');
  const r = parseInt(h6.substring(0, 2), 16) / 255;
  const g = parseInt(h6.substring(2, 4), 16) / 255;
  const b = parseInt(h6.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (val: number) => Math.round((val + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorPicker({ color, opacity = 100, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHSV(color || '#ffffff'));
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [hexInput, setHexInput] = useState(color || '#ffffff');
  const popoverRef = useRef<HTMLDivElement>(null);
  const satFieldRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSat = useRef(false);
  const isDraggingHue = useRef(false);

  useEffect(() => {
    if (color) {
      const newHsv = hexToHSV(color);
      setHsv(newHsv);
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

  const updateColor = useCallback((h: number, s: number, v: number, op?: number) => {
    const hex = hsvToHex(h, s, v);
    setHexInput(hex);
    onChange(hex, op ?? localOpacity);
  }, [onChange, localOpacity]);

  const handleSatMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingSat.current = true;
    handleSatMove(e.nativeEvent);
    const handleMove = (ev: MouseEvent) => { if (isDraggingSat.current) handleSatMove(ev); };
    const handleUp = () => { isDraggingSat.current = false; window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [hsv.h]);

  const handleSatMove = (e: MouseEvent) => {
    if (!satFieldRef.current) return;
    const rect = satFieldRef.current.getBoundingClientRect();
    const s = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const v = Math.min(100, Math.max(0, 100 - ((e.clientY - rect.top) / rect.height) * 100));
    setHsv(prev => ({ ...prev, s, v }));
    updateColor(hsv.h, s, v);
  };

  const handleHueMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingHue.current = true;
    handleHueMove(e.nativeEvent);
    const handleMove = (ev: MouseEvent) => { if (isDraggingHue.current) handleHueMove(ev); };
    const handleUp = () => { isDraggingHue.current = false; window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [hsv.s, hsv.v]);

  const handleHueMove = (e: MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const h = Math.min(360, Math.max(0, ((e.clientX - rect.left) / rect.width) * 360));
    setHsv(prev => ({ ...prev, h }));
    updateColor(h, hsv.s, hsv.v);
  };

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(val)) {
      const newHsv = hexToHSV(val);
      setHsv(newHsv);
      onChange(val, localOpacity);
    }
  }, [onChange, localOpacity]);

  const handleOpacityChange = useCallback((op: number) => {
    setLocalOpacity(op);
    const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
    onChange(hex, op);
  }, [hsv, onChange]);

  const hueColor = hsvToHex(hsv.h, 100, 100);

  return (
    <div className="relative" ref={popoverRef}>
      <div
        className="w-6 h-6 rounded border border-[#3c3c3c] cursor-pointer"
        style={{ backgroundColor: color || '#ffffff', opacity: localOpacity / 100 }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="absolute top-8 left-0 z-50 bg-[#2c2c2c] border border-[#3c3c3c] rounded-lg p-3 shadow-xl w-[220px]">
          <div
            ref={satFieldRef}
            className="w-[196px] h-[150px] rounded cursor-crosshair relative"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
            }}
            onMouseDown={handleSatMouseDown}
          >
            <div
              className="absolute w-3 h-3 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                boxShadow: '0 0 2px rgba(0,0,0,0.5)',
              }}
            />
          </div>
          <div
            ref={hueRef}
            className="w-[196px] h-3 rounded mt-2 cursor-pointer relative"
            style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
            onMouseDown={handleHueMouseDown}
          >
            <div
              className="absolute w-3 h-3 border-2 border-white rounded-full -translate-x-1/2 top-0 pointer-events-none"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                boxShadow: '0 0 2px rgba(0,0,0,0.5)',
              }}
            />
          </div>
          <div className="flex gap-2 mt-2 items-center">
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              onKeyDown={(e) => e.stopPropagation()}
              className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 flex-1 focus:border-[#7c5cfc] focus:outline-none"
              maxLength={9}
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={Math.round(localOpacity)}
                onChange={(e) => handleOpacityChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                onKeyDown={(e) => e.stopPropagation()}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1 w-12 focus:border-[#7c5cfc] focus:outline-none"
                min={0}
                max={100}
              />
              <span className="text-[10px] text-[#a0a0a0]">%</span>
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1 mt-2">
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                className="w-4 h-4 rounded-sm cursor-pointer border border-[#3c3c3c] hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                onClick={() => {
                  const newHsv = hexToHSV(c);
                  setHsv(newHsv);
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
