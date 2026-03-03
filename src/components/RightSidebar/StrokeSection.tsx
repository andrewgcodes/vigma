import React from 'react';
import SectionHeader from '../shared/SectionHeader';
import ColorPicker from '../ColorPicker/ColorPicker';
import NumberInput from '../shared/NumberInput';

interface StrokeSectionProps {
  enabled: boolean;
  color: string;
  width: number;
  style: string;
  onToggle: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onStyleChange: (style: string) => void;
}

export default function StrokeSection({
  enabled, color, width, style,
  onToggle, onColorChange, onWidthChange, onStyleChange,
}: StrokeSectionProps) {
  return (
    <div>
      <SectionHeader title="Stroke" showToggle enabled={enabled} onToggle={onToggle} />
      {enabled && (
        <div className="px-3 pb-2 space-y-2">
          <div className="flex items-center gap-2">
            <ColorPicker color={color} onChange={(c) => onColorChange(c)} />
            <span className="text-xs text-[#d0d0d0]">{color}</span>
          </div>
          <NumberInput label="Width" value={width} onChange={onWidthChange} min={1} max={50} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a0a0a0]">Style</span>
            <select
              value={style}
              onChange={(e) => onStyleChange(e.target.value)}
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 focus:border-[#7c5cfc] focus:outline-none"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
