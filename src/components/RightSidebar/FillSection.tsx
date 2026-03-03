import React from 'react';
import SectionHeader from '../shared/SectionHeader';
import ColorPicker from '../ColorPicker/ColorPicker';

interface FillSectionProps {
  enabled: boolean;
  color: string;
  onToggle: (enabled: boolean) => void;
  onChange: (color: string) => void;
}

export default function FillSection({ enabled, color, onToggle, onChange }: FillSectionProps) {
  return (
    <div>
      <SectionHeader title="Fill" showToggle enabled={enabled} onToggle={onToggle} />
      {enabled && (
        <div className="px-3 pb-2 flex items-center gap-2">
          <ColorPicker color={color} onChange={(c) => onChange(c)} />
          <span className="text-xs text-[#d0d0d0]">{color}</span>
        </div>
      )}
    </div>
  );
}
