import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import NumberInput from '../shared/NumberInput';
import SectionHeader from '../shared/SectionHeader';

interface TransformSectionProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  onChange: (prop: string, value: number) => void;
}

export default function TransformSection({ x, y, width, height, rotation, onChange }: TransformSectionProps) {
  const [aspectLocked, setAspectLocked] = useState(false);
  const aspectRatio = width / (height || 1);

  const handleWidthChange = (val: number) => {
    onChange('width', val);
    if (aspectLocked) {
      onChange('height', val / aspectRatio);
    }
  };

  const handleHeightChange = (val: number) => {
    onChange('height', val);
    if (aspectLocked) {
      onChange('width', val * aspectRatio);
    }
  };

  return (
    <div>
      <SectionHeader title="Transform" />
      <div className="px-3 pb-2 grid grid-cols-2 gap-2">
        <NumberInput label="X" value={x} onChange={(v) => onChange('left', v)} />
        <NumberInput label="Y" value={y} onChange={(v) => onChange('top', v)} />
        <div className="flex items-center gap-1">
          <NumberInput label="W" value={width} onChange={handleWidthChange} min={1} />
        </div>
        <div className="flex items-center gap-1">
          <NumberInput label="H" value={height} onChange={handleHeightChange} min={1} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <button
            className={`p-1 rounded ${aspectLocked ? 'text-[#7c5cfc]' : 'text-[#666]'} hover:text-white`}
            onClick={() => setAspectLocked(!aspectLocked)}
            title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {aspectLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          <NumberInput label="R" value={rotation} onChange={(v) => onChange('angle', v)} suffix="°" />
        </div>
      </div>
    </div>
  );
}
