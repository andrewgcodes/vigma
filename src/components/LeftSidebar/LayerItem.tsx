import React, { useState, useRef } from 'react';
import {
  Eye, EyeOff, Lock, Unlock, Square, Circle, Triangle, Type,
  Image, Minus, Star, Pencil, Group,
} from 'lucide-react';

interface LayerItemProps {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onRename: (name: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  dragOverId: string | null;
}

const typeIcons: Record<string, typeof Square> = {
  rectangle: Square,
  ellipse: Circle,
  triangle: Triangle,
  text: Type,
  image: Image,
  line: Minus,
  arrow: Minus,
  star: Star,
  pencil: Pencil,
  path: Pencil,
  group: Group,
};

export default function LayerItem({
  id, name, type, visible, locked, selected,
  onSelect, onToggleVisibility, onToggleLock, onRename,
  onContextMenu, onDragStart, onDragOver, onDrop, dragOverId,
}: LayerItemProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const TypeIcon = typeIcons[type] || Square;

  const handleDoubleClick = () => {
    setEditing(true);
    setEditName(name);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleFinishEdit = () => {
    setEditing(false);
    if (editName.trim()) {
      onRename(editName.trim());
    }
  };

  return (
    <div
      className={`h-8 px-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
        selected ? 'bg-[#7c5cfc33] border-l-2 border-[#7c5cfc]' : 'border-l-2 border-transparent hover:bg-[#333333]'
      } ${dragOverId === id ? 'border-t-2 border-t-blue-500' : ''}`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={() => onDrop(id)}
    >
      <button
        className="text-[#a0a0a0] hover:text-white shrink-0"
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <button
        className="text-[#a0a0a0] hover:text-white shrink-0"
        onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
      >
        {locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
      <TypeIcon size={12} className="text-[#a0a0a0] shrink-0" />
      {editing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') handleFinishEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="flex-1 bg-[#1e1e1e] text-white text-xs h-5 px-1 rounded border border-[#7c5cfc] focus:outline-none min-w-0"
          autoFocus
        />
      ) : (
        <span
          className="text-xs text-[#d0d0d0] truncate flex-1 min-w-0"
          onDoubleClick={handleDoubleClick}
        >
          {name}
        </span>
      )}
    </div>
  );
}
