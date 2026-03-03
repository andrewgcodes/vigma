import React from 'react';
import {
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
} from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';

interface AlignmentSectionProps {
  onAlign: (alignment: string) => void;
  enabled: boolean;
}

const alignButtons = [
  { key: 'align-left', icon: AlignStartHorizontal, tooltip: 'Align Left' },
  { key: 'align-center-h', icon: AlignCenterHorizontal, tooltip: 'Align Center' },
  { key: 'align-right', icon: AlignEndHorizontal, tooltip: 'Align Right' },
  { key: 'align-top', icon: AlignStartVertical, tooltip: 'Align Top' },
  { key: 'align-center-v', icon: AlignCenterVertical, tooltip: 'Align Middle' },
  { key: 'align-bottom', icon: AlignEndVertical, tooltip: 'Align Bottom' },
];

export default function AlignmentSection({ onAlign, enabled }: AlignmentSectionProps) {
  return (
    <div>
      <SectionHeader title="Alignment" />
      <div className="px-3 pb-2">
        <div className="flex items-center gap-0.5">
          {alignButtons.map(({ key, icon: Icon, tooltip }) => (
            <button
              key={key}
              className={`p-1.5 rounded transition-colors ${
                enabled
                  ? 'text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] cursor-pointer'
                  : 'text-[#555] cursor-not-allowed'
              }`}
              onClick={() => enabled && onAlign(key)}
              disabled={!enabled}
              title={tooltip}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 mt-1">
          <button
            className={`flex-1 px-2 py-1 rounded text-[10px] transition-colors ${
              enabled
                ? 'text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] cursor-pointer'
                : 'text-[#555] cursor-not-allowed'
            }`}
            onClick={() => enabled && onAlign('distribute-h')}
            disabled={!enabled}
            title="Distribute Horizontally"
          >
            Distribute H
          </button>
          <button
            className={`flex-1 px-2 py-1 rounded text-[10px] transition-colors ${
              enabled
                ? 'text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] cursor-pointer'
                : 'text-[#555] cursor-not-allowed'
            }`}
            onClick={() => enabled && onAlign('distribute-v')}
            disabled={!enabled}
            title="Distribute Vertically"
          >
            Distribute V
          </button>
        </div>
      </div>
    </div>
  );
}
