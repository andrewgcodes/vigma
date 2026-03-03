import React from 'react';
import SectionHeader from '../shared/SectionHeader';
import ColorPicker from '../ColorPicker/ColorPicker';
import NumberInput from '../shared/NumberInput';

interface ShadowSectionProps {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  onToggle: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
  onOffsetXChange: (value: number) => void;
  onOffsetYChange: (value: number) => void;
  onBlurChange: (value: number) => void;
}

export default function ShadowSection({
  enabled, color, offsetX, offsetY, blur,
  onToggle, onColorChange, onOffsetXChange, onOffsetYChange, onBlurChange,
}: ShadowSectionProps) {
  return (
    <div>
      <SectionHeader title="Shadow" showToggle enabled={enabled} onToggle={onToggle} />
      {enabled && (
        <div className="px-3 pb-2 space-y-2">
          <div className="flex items-center gap-2">
            <ColorPicker color={color} onChange={(c) => onColorChange(c)} />
            <span className="text-xs text-[#d0d0d0]">{color}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={offsetX} onChange={onOffsetXChange} min={-50} max={50} />
            <NumberInput label="Y" value={offsetY} onChange={onOffsetYChange} min={-50} max={50} />
          </div>
          <NumberInput label="Blur" value={blur} onChange={onBlurChange} min={0} max={100} />
        </div>
      )}
    </div>
  );
}
