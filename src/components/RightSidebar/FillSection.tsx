import { useState, useEffect } from 'react';
import ColorPicker from '../ColorPicker/ColorPicker';
import SectionHeader from '../shared/SectionHeader';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface FillSectionProps {
  obj: FabricObject;
}

export default function FillSection({ obj }: FillSectionProps) {
  const { canvasRef } = useAppContext();
  const [enabled, setEnabled] = useState(!!obj.fill && obj.fill !== 'transparent');
  const fillColor = typeof obj.fill === 'string' ? obj.fill : '#7c5cfc';

  useEffect(() => {
    setEnabled(!!obj.fill && obj.fill !== 'transparent');
  }, [obj.fill]);

  const handleToggle = (on: boolean) => {
    setEnabled(on);
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set({ fill: on ? '#7c5cfc' : 'transparent' });
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const handleColorChange = (color: string, _opacity?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set({ fill: color });
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  return (
    <div>
      <SectionHeader title="Fill" showToggle enabled={enabled} onToggle={handleToggle} />
      {enabled && (
        <div className="px-3 pb-2 flex items-center gap-2">
          <ColorPicker color={fillColor} onChange={handleColorChange} />
          <span className="text-xs text-[#a0a0a0]">{fillColor}</span>
        </div>
      )}
    </div>
  );
}
