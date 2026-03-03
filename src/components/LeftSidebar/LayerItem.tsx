import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Square, Circle, Triangle, Minus, Type, Image, Star, Group, Frame, Spline, ChevronRight, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { findObjectById, setObjectName } from '../../utils/canvasHelpers';
import type { LayerInfo } from '../../types';

const iconMap: Record<string, React.ReactNode> = {
  rect: <Square size={12} />,
  ellipse: <Circle size={12} />,
  triangle: <Triangle size={12} />,
  line: <Minus size={12} />,
  path: <Spline size={12} />,
  textbox: <Type size={12} />,
  image: <Image size={12} />,
  group: <Group size={12} />,
  polygon: <Star size={12} />,
  frame: <Frame size={12} />,
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
  depth?: number;
}

export default function LayerItem({ layer, isSelected, onSelect, onContextMenu, onDragStart, onDragOver, onDrop, index, depth = 0 }: LayerItemProps) {
  const { canvasRef, state } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [expanded, setExpanded] = useState(layer.expanded ?? true);
  const hasChildren = layer.children && layer.children.length > 0;
  const isContainer = layer.type === 'group' || layer.type === 'frame';
  const selected = isSelected || state.selectedObjectIds.includes(layer.id);

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

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <>
      <div
        className={`flex items-center gap-1.5 h-8 cursor-pointer select-none text-[#d0d0d0] hover:bg-[#333333] transition-colors
          ${selected ? 'bg-[#7c5cfc33] border-l-2 border-[#7c5cfc]' : 'border-l-2 border-transparent'}
        `}
        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '8px' }}
        onClick={() => onSelect(layer.id)}
        onContextMenu={(e) => onContextMenu(e, layer.id)}
        draggable={depth === 0}
        onDragStart={depth === 0 ? (e) => onDragStart(e, index) : undefined}
        onDragOver={depth === 0 ? (e) => onDragOver(e, index) : undefined}
        onDrop={depth === 0 ? (e) => onDrop(e, index) : undefined}
      >
        {isContainer ? (
          <button className="text-[#a0a0a0] hover:text-white shrink-0 w-3" onClick={toggleExpanded}>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
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
      {isContainer && expanded && hasChildren && (
        layer.children!.map((child) => (
          <LayerItem
            key={child.id}
            layer={child}
            isSelected={state.selectedObjectIds.includes(child.id)}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            index={index}
            depth={depth + 1}
          />
        ))
      )}
    </>
  );
}
