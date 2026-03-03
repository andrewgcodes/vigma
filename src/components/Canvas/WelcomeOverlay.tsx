import React from 'react';
import { Square, Circle, Type, Pencil, Image, FileJson } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { ToolType } from '../../types';

interface WelcomeOverlayProps {
  onDismiss: () => void;
  onImageUpload: () => void;
  onImportJSON: () => void;
}

const quickStartCards: { icon: typeof Square; label: string; tool?: ToolType; action?: string }[] = [
  { icon: Square, label: 'Rectangle', tool: 'rectangle' },
  { icon: Circle, label: 'Ellipse', tool: 'ellipse' },
  { icon: Type, label: 'Text', tool: 'text' },
  { icon: Pencil, label: 'Draw', tool: 'pencil' },
  { icon: Image, label: 'Image', action: 'image' },
  { icon: FileJson, label: 'Import JSON', action: 'json' },
];

export default function WelcomeOverlay({ onDismiss, onImageUpload, onImportJSON }: WelcomeOverlayProps) {
  const { setTool } = useAppContext();

  const handleClick = (card: typeof quickStartCards[0]) => {
    if (card.tool) {
      setTool(card.tool);
    } else if (card.action === 'image') {
      onImageUpload();
    } else if (card.action === 'json') {
      onImportJSON();
    }
    onDismiss();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-[#252525]/90 rounded-xl p-8 max-w-[500px] pointer-events-auto">
        <h1 className="text-2xl font-bold text-white">Welcome to Vigma</h1>
        <p className="text-sm text-[#a0a0a0] mt-2">
          A free, browser-based design tool. Start creating!
        </p>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {quickStartCards.map((card) => (
            <button
              key={card.label}
              className="flex flex-col items-center justify-center gap-2 bg-[#333333] rounded-lg p-4 cursor-pointer hover:bg-[#3c3c3c] transition-colors h-20"
              onClick={() => handleClick(card)}
            >
              <card.icon size={24} className="text-[#a0a0a0]" />
              <span className="text-xs text-[#d0d0d0]">{card.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
