import { useState, useEffect } from 'react';
import { Plus, Minus, Eye, EyeOff } from 'lucide-react';
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
  const [visible, setVisible] = useState(true);
  const strokeColor = typeof obj.stroke === 'string' && obj.stroke !== 'transparent' ? obj.stroke : '#000000';
  const record = obj as unknown as Record<string, unknown>;
  const strokePosition = (record.strokePosition as string) || 'center';

  useEffect(() => {
    setEnabled(!!obj.stroke && obj.stroke !== 'transparent');
  }, [obj.stroke]);

  const handleAdd = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set({ stroke: '#000000', strokeWidth: 1 });
    setEnabled(true);
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set({ stroke: 'transparent', strokeWidth: 0 });
    setEnabled(false);
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const toggleVisibility = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (visible) {
      record._savedStroke = obj.stroke;
      record._savedStrokeWidth = obj.strokeWidth;
      obj.set({ stroke: 'transparent', strokeWidth: 0 });
    } else {
      obj.set({
        stroke: (record._savedStroke as string) || strokeColor,
        strokeWidth: (record._savedStrokeWidth as number) || 1,
      });
    }
    setVisible(!visible);
    canvas.requestRenderAll();
  };

  const update = (props: Record<string, unknown>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set(props);
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const updatePosition = (pos: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    record.strokePosition = pos;
    if (pos === 'inside') {
      obj.set({ paintFirst: 'stroke', strokeUniform: true });
    } else {
      obj.set({ paintFirst: 'fill', strokeUniform: true });
    }
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
      <SectionHeader title="Stroke">
        <button
          className="p-0.5 rounded text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] cursor-pointer"
          onClick={enabled ? handleRemove : handleAdd}
          title={enabled ? 'Remove stroke' : 'Add stroke'}
        >
          {enabled ? <Minus size={12} /> : <Plus size={12} />}
        </button>
      </SectionHeader>
      {enabled && (
        <div className="px-3 pb-2 space-y-2">
          <div className="flex items-center gap-2">
            <ColorPicker color={strokeColor} onChange={(c) => update({ stroke: c })} />
            <span className="text-xs text-[#a0a0a0] flex-1 font-mono">{strokeColor.replace('#', '').toUpperCase()}</span>
            <span className="text-xs text-[#a0a0a0]">100%</span>
            <button
              className="p-0.5 rounded text-[#a0a0a0] hover:text-white cursor-pointer"
              onClick={toggleVisibility}
              title={visible ? 'Hide stroke' : 'Show stroke'}
            >
              {visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#a0a0a0] font-medium">Position</label>
              <select
                value={strokePosition}
                onChange={(e) => updatePosition(e.target.value)}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1 focus:border-[#7c5cfc] focus:outline-none cursor-pointer"
              >
                <option value="center">Center</option>
                <option value="inside">Inside</option>
                <option value="outside">Outside</option>
              </select>
            </div>
            <NumberInput label="Weight" value={obj.strokeWidth || 1} onChange={(v) => update({ strokeWidth: v })} min={1} max={50} />
          </div>
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
      )}
    </div>
  );
}
