import { useState, useEffect } from 'react';
import { Shadow } from 'fabric';
import ColorPicker from '../ColorPicker/ColorPicker';
import SectionHeader from '../shared/SectionHeader';
import NumberInput from '../shared/NumberInput';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface ShadowSectionProps {
  obj: FabricObject;
}

export default function ShadowSection({ obj }: ShadowSectionProps) {
  const { canvasRef } = useAppContext();
  const [enabled, setEnabled] = useState(!!obj.shadow);
  const shadow = obj.shadow instanceof Shadow ? obj.shadow : null;

  useEffect(() => {
    setEnabled(!!obj.shadow);
  }, [obj.shadow]);

  const handleToggle = (on: boolean) => {
    setEnabled(on);
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (on) {
      obj.set({ shadow: new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 }) });
    } else {
      obj.set({ shadow: undefined });
    }
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const updateShadow = (props: Partial<{ color: string; offsetX: number; offsetY: number; blur: number }>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = obj.shadow instanceof Shadow ? obj.shadow : new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 });
    const newShadow = new Shadow({
      color: props.color ?? current.color,
      offsetX: props.offsetX ?? current.offsetX,
      offsetY: props.offsetY ?? current.offsetY,
      blur: props.blur ?? current.blur,
    });
    obj.set({ shadow: newShadow });
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  return (
    <div>
      <SectionHeader title="Shadow" showToggle enabled={enabled} onToggle={handleToggle} />
      {enabled && shadow && (
        <div className="px-3 pb-2 space-y-2">
          <div className="flex items-center gap-2">
            <ColorPicker color={shadow.color || '#000000'} onChange={(c) => updateShadow({ color: c })} />
            <span className="text-xs text-[#a0a0a0]">Shadow Color</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput label="X" value={shadow.offsetX || 0} onChange={(v) => updateShadow({ offsetX: v })} min={-50} max={50} />
            <NumberInput label="Y" value={shadow.offsetY || 0} onChange={(v) => updateShadow({ offsetY: v })} min={-50} max={50} />
            <NumberInput label="Blur" value={shadow.blur || 0} onChange={(v) => updateShadow({ blur: v })} min={0} max={100} />
          </div>
        </div>
      )}
    </div>
  );
}
