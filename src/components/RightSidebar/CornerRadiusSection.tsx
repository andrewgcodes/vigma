import SectionHeader from '../shared/SectionHeader';
import NumberInput from '../shared/NumberInput';
import { useAppContext } from '../../store/canvasStore';
import type { Rect } from 'fabric';

interface CornerRadiusSectionProps {
  obj: Rect;
}

export default function CornerRadiusSection({ obj }: CornerRadiusSectionProps) {
  const { canvasRef } = useAppContext();

  const handleChange = (value: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    obj.set({ rx: value, ry: value });
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  return (
    <div>
      <SectionHeader title="Corner Radius" />
      <div className="px-3 pb-2">
        <NumberInput label="Radius" value={obj.rx || 0} onChange={handleChange} min={0} max={100} />
      </div>
    </div>
  );
}
