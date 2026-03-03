import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import NumberInput from '../shared/NumberInput';
import ColorPicker from '../ColorPicker/ColorPicker';
import { useAppContext } from '../../store/canvasStore';
import type { Textbox } from 'fabric';

interface TextSectionProps {
  obj: Textbox;
}

const FONTS = ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Comic Sans MS'];

export default function TextSection({ obj }: TextSectionProps) {
  const { canvasRef } = useAppContext();

  const update = (props: Record<string, unknown>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set(props);
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const fillColor = typeof obj.fill === 'string' ? obj.fill : '#ffffff';

  return (
    <div>
      <SectionHeader title="Text" />
      <div className="px-3 pb-2 space-y-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#a0a0a0] font-medium">Font Family</label>
          <select
            value={obj.fontFamily || 'Inter'}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1 focus:border-[#7c5cfc] focus:outline-none cursor-pointer"
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Size" value={obj.fontSize || 24} onChange={(v) => update({ fontSize: v })} min={8} max={200} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#a0a0a0] font-medium">Weight</label>
            <select
              value={String(obj.fontWeight || '400')}
              onChange={(e) => update({ fontWeight: e.target.value })}
              className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1 focus:border-[#7c5cfc] focus:outline-none cursor-pointer"
            >
              <option value="400">Normal (400)</option>
              <option value="500">Medium (500)</option>
              <option value="700">Bold (700)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#a0a0a0] font-medium">Alignment</label>
          <div className="flex gap-1">
            {([
              { align: 'left', icon: <AlignLeft size={16} /> },
              { align: 'center', icon: <AlignCenter size={16} /> },
              { align: 'right', icon: <AlignRight size={16} /> },
            ] as const).map(({ align, icon }) => (
              <button
                key={align}
                className={`p-1.5 rounded cursor-pointer ${obj.textAlign === align ? 'bg-[#3c3c3c] text-white' : 'text-[#a0a0a0] hover:bg-[#3c3c3c]'}`}
                onClick={() => update({ textAlign: align })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ColorPicker color={fillColor} onChange={(c) => update({ fill: c })} />
          <span className="text-xs text-[#a0a0a0]">Text Color</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Line Height" value={obj.lineHeight || 1.2} onChange={(v) => update({ lineHeight: v })} min={0.5} max={3} step={0.1} />
          <NumberInput label="Letter Spacing" value={obj.charSpacing ? obj.charSpacing / 10 : 0} onChange={(v) => update({ charSpacing: v * 10 })} min={-20} max={100} step={1} />
        </div>
      </div>
    </div>
  );
}
