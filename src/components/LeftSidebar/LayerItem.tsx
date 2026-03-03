import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Square, Circle, Triangle, Minus, Type, Image, Pencil, Star, Group } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { findObjectById, setObjectName } from '../../utils/canvasHelpers';
import type { LayerInfo } from '../../types';

const iconMap: Record<string, React.ReactNode> = {
  rect: <Square size={12} />,
  ellipse: <Circle size={12} />,
  triangle: <Triangle size={12} />,
  line: <Minus size={12} />,
  path: <Pencil size={12} />,
  textbox: <Type size={12} />,
  image: <Image size={12} />,
  group: <Group size={12} />,
  polygon: <Star size={12} />,
};

interface LayerItemProps {
  layer: LayerInfo;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  index: number;
}

export default function LayerItem({ layer, isSelected, onSelect, onContextMenu, onDragStart, onDragOver, onDrop, index }: LayerItemProps) {
  const { canvasRef } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = findObjectById(canvas, layer.id);
    if (obj) {
      obj.visible = !obj.visible;
      canvas.requestRenderAll();
      window.dispatchEvent(new CustomEvent('vigma:update-layers'));
    }
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = findObjectById(canvas, layer.id);
    if (obj) {
      obj.selectable = !obj.selectable;
      obj.evented = obj.selectable;
      canvas.requestRenderAll();
      window.dispatchEvent(new CustomEvent('vigma:update-layers'));
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(layer.name);
  };

  const handleRename = () => {
    setIsEditing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = findObjectById(canvas, layer.id);
    if (obj) {
      setObjectName(obj, editName || layer.name);
      window.dispatchEvent(new CustomEvent('vigma:update-layers'));
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 h-8 px-2 cursor-pointer select-none text-[#d0d0d0] hover:bg-[#333333] transition-colors
        ${isSelected ? 'bg-[#7c5cfc33] border-l-2 border-[#7c5cfc]' : 'border-l-2 border-transparent'}
      `}
      onClick={() => onSelect(layer.id)}
      onContextMenu={(e) => onContextMenu(e, layer.id)}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
    >
      <button className="text-[#a0a0a0] hover:text-white shrink-0" onClick={toggleVisibility}>
        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <button className="text-[#a0a0a0] hover:text-white shrink-0" onClick={toggleLock}>
        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
      <span className="text-[#a0a0a0] shrink-0">{iconMap[layer.type] || <Square size={12} />}</span>
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleRename(); }}
          className="bg-[#1e1e1e] text-white text-xs px-1 h-5 rounded border border-[#7c5cfc] outline-none flex-1 min-w-0"
          autoFocus
        />
      ) : (
        <span className="text-xs truncate flex-1 min-w-0" onDoubleClick={handleDoubleClick}>
          {layer.name}
        </span>
      )}
    </div>
  );
}
