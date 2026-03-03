import SectionHeader from '../shared/SectionHeader';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface OpacitySectionProps {
  obj: FabricObject;
}

export default function OpacitySection({ obj }: OpacitySectionProps) {
  const { canvasRef } = useAppContext();
  const opacity = Math.round((obj.opacity ?? 1) * 100);

  const handleChange = (value: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set({ opacity: value / 100 });
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  return (
    <div>
      <SectionHeader title="Opacity" />
      <div className="px-3 pb-2 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => handleChange(parseInt(e.target.value))}
          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-[#7c5cfc]"
          style={{ background: `linear-gradient(to right, #7c5cfc ${opacity}%, #3c3c3c ${opacity}%)` }}
        />
        <input
          type="number"
          value={opacity}
          onChange={(e) => handleChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          onKeyDown={(e) => e.stopPropagation()}
          className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1.5 w-14 focus:border-[#7c5cfc] focus:outline-none"
          min={0}
          max={100}
        />
        <span className="text-[10px] text-[#a0a0a0]">%</span>
      </div>
    </div>
  );
}
