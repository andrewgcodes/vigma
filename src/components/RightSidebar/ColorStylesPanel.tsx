import React, { useState } from 'react';
import { Plus, Trash2, Droplets } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { v4 as uuidv4 } from 'uuid';
import SectionHeader from '../shared/SectionHeader';

interface ColorStylesPanelProps {
  currentColor: string;
  onApplyColor: (color: string) => void;
}

export default function ColorStylesPanel({ currentColor, onApplyColor }: ColorStylesPanelProps) {
  const { state, addColorStyle, deleteColorStyle } = useAppContext();
  const [showNameInput, setShowNameInput] = useState(false);
  const [styleName, setStyleName] = useState('');

  const handleAddStyle = () => {
    if (styleName.trim()) {
      addColorStyle({
        id: uuidv4(),
        name: styleName.trim(),
        color: currentColor,
      });
      setStyleName('');
      setShowNameInput(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Color Styles" />
      <div className="px-3 pb-2">
        <div className="flex flex-wrap gap-1 mb-1">
          {state.colorStyles.map((style) => (
            <div key={style.id} className="group relative">
              <button
                className="w-6 h-6 rounded border border-[#3c3c3c] hover:border-[#7c5cfc] transition-colors"
                style={{ backgroundColor: style.color }}
                onClick={() => onApplyColor(style.color)}
                title={`${style.name} (${style.color})`}
              />
              <button
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); deleteColorStyle(style.id); }}
              >
                x
              </button>
            </div>
          ))}
        </div>
        {showNameInput ? (
          <div className="flex items-center gap-1">
            <input
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleAddStyle();
                if (e.key === 'Escape') setShowNameInput(false);
              }}
              placeholder="Style name"
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-6 px-1.5 rounded focus:border-[#7c5cfc] focus:outline-none"
              autoFocus
            />
            <button
              className="text-[#7c5cfc] text-xs hover:text-white"
              onClick={handleAddStyle}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-[#a0a0a0] hover:text-white"
            onClick={() => setShowNameInput(true)}
          >
            <Plus size={10} />
            Save as style
          </button>
        )}
      </div>
    </div>
  );
}
