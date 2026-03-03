import React, { useState, useCallback } from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { LayerInfo } from '../../types';
import LayerItem from './LayerItem';
import PagesPanel from './PagesPanel';

interface LeftSidebarProps {
  layers: LayerInfo[];
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onReorderLayer: (fromId: string, toId: string) => void;
  onAddRectangle: () => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onSwitchPage: (pageId: string) => void;
  onToggleExpand: (id: string) => void;
}

export default function LeftSidebar({
  layers, onSelectLayer, onToggleVisibility, onToggleLock,
  onRenameLayer, onReorderLayer, onAddRectangle, onContextMenu,
  onSwitchPage, onToggleExpand,
}: LeftSidebarProps) {
  const { state, dispatch } = useAppContext();
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragFromId, setDragFromId] = useState<string | null>(null);

  if (!state.leftSidebarOpen) {
    return (
      <div className="w-2 bg-[#252525] border-r border-[#3c3c3c] flex items-start pt-2 justify-center">
        <button
          className="text-[#a0a0a0] hover:text-white"
          onClick={() => dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' })}
        >
          <PanelLeftOpen size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 bg-[#252525] border-r border-[#3c3c3c] flex flex-col select-none">
      <PagesPanel onSwitchPage={onSwitchPage} />
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#3c3c3c]">
        <span className="text-xs text-[#a0a0a0] font-semibold uppercase tracking-wider">Layers</span>
        <div className="flex items-center gap-1">
          <button
            className="text-[#a0a0a0] hover:text-white p-0.5"
            onClick={onAddRectangle}
            title="Add Rectangle"
          >
            <Plus size={14} />
          </button>
          <button
            className="text-[#a0a0a0] hover:text-white p-0.5"
            onClick={() => dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' })}
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {[...layers].reverse().map((layer) => (
          <LayerItem
            key={layer.id}
            id={layer.id}
            name={layer.name}
            type={layer.type}
            visible={layer.visible}
            locked={layer.locked}
            selected={layer.selected}
            children={layer.children}
            depth={layer.depth}
            expanded={layer.expanded}
            isComponent={layer.isComponent}
            isInstance={layer.isInstance}
            onSelect={() => onSelectLayer(layer.id)}
            onToggleVisibility={() => onToggleVisibility(layer.id)}
            onToggleLock={() => onToggleLock(layer.id)}
            onRename={(name) => onRenameLayer(layer.id, name)}
            onContextMenu={(e) => onContextMenu(e, layer.id)}
            onDragStart={(id) => setDragFromId(id)}
            onDragOver={(e, id) => { e.preventDefault(); setDragOverId(id); }}
            onDrop={(toId) => {
              if (dragFromId && dragFromId !== toId) {
                onReorderLayer(dragFromId, toId);
              }
              setDragFromId(null);
              setDragOverId(null);
            }}
            dragOverId={dragOverId}
            onToggleExpand={onToggleExpand}
            onSelectLayer={onSelectLayer}
            onToggleVisibilityById={onToggleVisibility}
            onToggleLockById={onToggleLock}
            onRenameById={onRenameLayer}
            onContextMenuById={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
}
