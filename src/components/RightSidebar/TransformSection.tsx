import { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import NumberInput from '../shared/NumberInput';
import SectionHeader from '../shared/SectionHeader';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface TransformSectionProps {
  obj: FabricObject;
}

export default function TransformSection({ obj }: TransformSectionProps) {
  const { canvasRef } = useAppContext();
  const [lockRatio, setLockRatio] = useState(false);

  const update = (props: Record<string, number>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set(props);
    obj.setCoords();
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const w = (obj.width || 0) * (obj.scaleX || 1);
  const h = (obj.height || 0) * (obj.scaleY || 1);

  return (
    <div>
      <SectionHeader title="Transform" />
      <div className="grid grid-cols-2 gap-2 px-3 pb-2">
        <NumberInput label="X" value={obj.left || 0} onChange={(v) => update({ left: v })} />
        <NumberInput label="Y" value={obj.top || 0} onChange={(v) => update({ top: v })} />
        <div className="relative">
          <NumberInput label="W" value={w} onChange={(v) => {
            const ratio = v / w;
            const props: Record<string, number> = { scaleX: v / (obj.width || 1) };
            if (lockRatio) props.scaleY = (obj.scaleY || 1) * ratio;
            update(props);
          }} min={1} />
        </div>
        <div className="relative">
          <NumberInput label="H" value={h} onChange={(v) => {
            const ratio = v / h;
            const props: Record<string, number> = { scaleY: v / (obj.height || 1) };
            if (lockRatio) props.scaleX = (obj.scaleX || 1) * ratio;
            update(props);
          }} min={1} />
        </div>
        <NumberInput label="R°" value={obj.angle || 0} onChange={(v) => update({ angle: v })} min={0} max={360} />
        <div className="flex items-end pb-0.5">
          <button
            className={`p-1 rounded ${lockRatio ? 'text-[#7c5cfc]' : 'text-[#a0a0a0]'} hover:bg-[#3c3c3c] cursor-pointer`}
            onClick={() => setLockRatio(!lockRatio)}
            title="Lock aspect ratio"
          >
            {lockRatio ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
