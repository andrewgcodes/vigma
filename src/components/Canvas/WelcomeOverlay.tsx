import { Square, Circle, Type, Pencil, Image, FileJson } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { useRef } from 'react';

export default function WelcomeOverlay() {
  const { dispatch } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cards = [
    { icon: <Square size={24} />, label: 'Rectangle', action: () => dispatch({ type: 'SET_TOOL', tool: 'rectangle' }) },
    { icon: <Circle size={24} />, label: 'Ellipse', action: () => dispatch({ type: 'SET_TOOL', tool: 'ellipse' }) },
    { icon: <Type size={24} />, label: 'Text', action: () => dispatch({ type: 'SET_TOOL', tool: 'text' }) },
    { icon: <Pencil size={24} />, label: 'Draw', action: () => dispatch({ type: 'SET_TOOL', tool: 'pencil' }) },
    { icon: <Image size={24} />, label: 'Image', action: () => {
      const event = new CustomEvent('vigma:trigger-image-upload');
      window.dispatchEvent(event);
    }},
    { icon: <FileJson size={24} />, label: 'Import JSON', action: () => fileInputRef.current?.click() },
  ];

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      window.dispatchEvent(new CustomEvent('vigma:import-json', { detail: json }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-[#252525]/90 rounded-xl p-8 max-w-[500px] pointer-events-auto">
        <h1 className="text-white text-2xl font-bold">Welcome to Vigma</h1>
        <p className="text-[#a0a0a0] text-sm mt-2">A free, browser-based design tool. Start creating!</p>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {cards.map((card) => (
            <button
              key={card.label}
              className="flex flex-col items-center justify-center gap-2 bg-[#333333] rounded-lg p-4 cursor-pointer hover:bg-[#3c3c3c] transition-colors text-[#a0a0a0] hover:text-white"
              style={{ width: 140, height: 80 }}
              onClick={card.action}
            >
              {card.icon}
              <span className="text-xs font-medium">{card.label}</span>
            </button>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportJSON}
        />
      </div>
    </div>
  );
}
