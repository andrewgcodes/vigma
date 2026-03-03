import React, { useState, useRef } from 'react';
import {
  Eye, EyeOff, Lock, Unlock, Square, Circle, Triangle, Type,
  Image, Minus, Star, Pencil, Group, ChevronRight, ChevronDown,
  Frame, PenTool, Component, Copy,
} from 'lucide-react';
import { LayerInfo } from '../../types';

interface LayerItemProps {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  selected: boolean;
  children?: LayerInfo[];
  depth: number;
  expanded?: boolean;
  isComponent?: boolean;
  isInstance?: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onRename: (name: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  dragOverId: string | null;
  onToggleExpand?: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onToggleVisibilityById: (id: string) => void;
  onToggleLockById: (id: string) => void;
  onRenameById: (id: string, name: string) => void;
  onContextMenuById: (e: React.MouseEvent, id: string) => void;
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
  frame: Frame,
  pen: PenTool,
  component: Component,
  instance: Copy,
};

export default function LayerItem({
  id, name, type, visible, locked, selected,
  children, depth = 0, expanded, isComponent, isInstance,
  onSelect, onToggleVisibility, onToggleLock, onRename,
  onContextMenu, onDragStart, onDragOver, onDrop, dragOverId,
  onToggleExpand, onSelectLayer, onToggleVisibilityById, onToggleLockById,
  onRenameById, onContextMenuById,
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

  const hasChildren = children && children.length > 0;
  const indentPx = depth * 16;

  return (
    <>
      <div
        className={`h-8 flex items-center gap-1 cursor-pointer transition-colors ${
          selected ? 'bg-[#7c5cfc33] border-l-2 border-[#7c5cfc]' : 'border-l-2 border-transparent hover:bg-[#333333]'
        } ${dragOverId === id ? 'border-t-2 border-t-blue-500' : ''}`}
        style={{ paddingLeft: `${indentPx + 4}px`, paddingRight: '8px' }}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        draggable
        onDragStart={() => onDragStart(id)}
        onDragOver={(e) => onDragOver(e, id)}
        onDrop={() => onDrop(id)}
      >
        {hasChildren ? (
          <button
            className="text-[#a0a0a0] hover:text-white shrink-0 w-3"
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(id); }}
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
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
        {isComponent && <Component size={10} className="text-[#22c55e] shrink-0" />}
        {isInstance && <Copy size={10} className="text-[#8b5cf6] shrink-0" />}
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
      {hasChildren && expanded && children.map((child) => (
        <LayerItem
          key={child.id}
          id={child.id}
          name={child.name}
          type={child.type}
          visible={child.visible}
          locked={child.locked}
          selected={child.selected}
          children={child.children}
          depth={child.depth}
          expanded={child.expanded}
          isComponent={child.isComponent}
          isInstance={child.isInstance}
          onSelect={() => onSelectLayer(child.id)}
          onToggleVisibility={() => onToggleVisibilityById(child.id)}
          onToggleLock={() => onToggleLockById(child.id)}
          onRename={(name) => onRenameById(child.id, name)}
          onContextMenu={(e) => onContextMenuById(e, child.id)}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          dragOverId={dragOverId}
          onToggleExpand={onToggleExpand}
          onSelectLayer={onSelectLayer}
          onToggleVisibilityById={onToggleVisibilityById}
          onToggleLockById={onToggleLockById}
          onRenameById={onRenameById}
          onContextMenuById={onContextMenuById}
        />
      ))}
    </>
  );
}
