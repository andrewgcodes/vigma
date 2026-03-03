import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import NumberInput from '../shared/NumberInput';
import ColorPicker from '../ColorPicker/ColorPicker';
import { FONT_FAMILIES } from '../../utils/defaultStyles';

interface TextSectionProps {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textAlign: string;
  fill: string;
  lineHeight: number;
  charSpacing: number;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onFontWeightChange: (value: string) => void;
  onTextAlignChange: (value: string) => void;
  onFillChange: (value: string) => void;
  onLineHeightChange: (value: number) => void;
  onCharSpacingChange: (value: number) => void;
}

export default function TextSection({
  fontFamily, fontSize, fontWeight, textAlign, fill, lineHeight, charSpacing,
  onFontFamilyChange, onFontSizeChange, onFontWeightChange,
  onTextAlignChange, onFillChange, onLineHeightChange, onCharSpacingChange,
}: TextSectionProps) {
  return (
    <div>
      <SectionHeader title="Text" />
      <div className="px-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a0a0a0] shrink-0">Font</span>
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 focus:border-[#7c5cfc] focus:outline-none"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Size" value={fontSize} onChange={onFontSizeChange} min={8} max={200} />
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#a0a0a0]">Wt</span>
            <select
              value={fontWeight}
              onChange={(e) => onFontWeightChange(e.target.value)}
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 focus:border-[#7c5cfc] focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="500">Medium</option>
              <option value="bold">Bold</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a0a0a0]">Align</span>
          <div className="flex gap-0.5">
            {([
              { val: 'left', icon: AlignLeft },
              { val: 'center', icon: AlignCenter },
              { val: 'right', icon: AlignRight },
            ] as const).map(({ val, icon: Icon }) => (
              <button
                key={val}
                className={`p-1.5 rounded ${textAlign === val ? 'bg-[#3c3c3c] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                onClick={() => onTextAlignChange(val)}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a0a0a0]">Color</span>
          <ColorPicker color={fill} onChange={(c) => onFillChange(c)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Line H" value={lineHeight} onChange={onLineHeightChange} min={0.5} max={3} step={0.1} />
          <NumberInput label="Letter" value={charSpacing} onChange={onCharSpacingChange} min={-200} max={1000} step={10} />
        </div>
      </div>
    </div>
  );
}
