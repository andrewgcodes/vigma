import { useState, useEffect } from 'react';
import ColorPicker from '../ColorPicker/ColorPicker';
import SectionHeader from '../shared/SectionHeader';
import NumberInput from '../shared/NumberInput';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface StrokeSectionProps {
  obj: FabricObject;
}

export default function StrokeSection({ obj }: StrokeSectionProps) {
  const { canvasRef } = useAppContext();
  const [enabled, setEnabled] = useState(!!obj.stroke && obj.stroke !== 'transparent');
  const strokeColor = typeof obj.stroke === 'string' && obj.stroke !== 'transparent' ? obj.stroke : '#5a3fd6';

  useEffect(() => {
    setEnabled(!!obj.stroke && obj.stroke !== 'transparent');
  }, [obj.stroke]);

  const handleToggle = (on: boolean) => {
    setEnabled(on);
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set({ stroke: on ? '#5a3fd6' : 'transparent', strokeWidth: on ? (obj.strokeWidth || 1) : 0 });
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const update = (props: Record<string, unknown>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set(props);
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const getDashArray = (): string => {
    const d = obj.strokeDashArray;
    if (!d || d.length === 0) return 'solid';
    if (d[0] === 5) return 'dashed';
    if (d[0] === 2) return 'dotted';
    return 'solid';
  };

  return (
    <div>
      <SectionHeader title="Stroke" showToggle enabled={enabled} onToggle={handleToggle} />
      {enabled && (
        <div className="px-3 pb-2 space-y-2">
          <div className="flex items-center gap-2">
            <ColorPicker color={strokeColor} onChange={(c) => update({ stroke: c })} />
            <span className="text-xs text-[#a0a0a0]">{strokeColor}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Width" value={obj.strokeWidth || 1} onChange={(v) => update({ strokeWidth: v })} min={1} max={50} />
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#a0a0a0] font-medium">Style</label>
              <select
                value={getDashArray()}
                onChange={(e) => {
                  const val = e.target.value;
                  const dashArray = val === 'dashed' ? [5, 5] : val === 'dotted' ? [2, 2] : [];
                  update({ strokeDashArray: dashArray });
                }}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1 focus:border-[#7c5cfc] focus:outline-none cursor-pointer"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
