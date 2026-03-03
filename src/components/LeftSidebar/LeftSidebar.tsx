import React, { useState, useCallback } from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import LayerItem from './LayerItem';
import { useAppContext } from '../../store/canvasStore';
import { findObjectById, assignObjectId, assignDefaultName } from '../../utils/canvasHelpers';

export default function LeftSidebar() {
  const { state, dispatch, canvasRef } = useAppContext();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);

  const handleSelect = useCallback((id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = findObjectById(canvas, id);
    if (obj && obj.selectable) {
      canvas.discardActiveObject();
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    }
  }, [canvasRef]);

  const handleAddRect = useCallback(() => {
    window.dispatchEvent(new CustomEvent('vigma:add-rect'));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  }, []);

  const handleContextAction = useCallback((action: string, id: string) => {
    setContextMenu(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = findObjectById(canvas, id);
    if (!obj) return;

    switch (action) {
      case 'rename':
        break;
      case 'duplicate':
        obj.clone(['objectId', 'customName']).then((cloned: typeof obj) => {
          cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
          assignObjectId(cloned);
          assignDefaultName(cloned);
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.requestRenderAll();
          window.dispatchEvent(new CustomEvent('vigma:update-layers'));
          window.dispatchEvent(new CustomEvent('vigma:save-history'));
        });
        break;
      case 'delete':
        canvas.remove(obj);
        canvas.requestRenderAll();
        window.dispatchEvent(new CustomEvent('vigma:update-layers'));
        window.dispatchEvent(new CustomEvent('vigma:save-history'));
        break;
      case 'front':
        canvas.bringObjectToFront(obj);
        canvas.requestRenderAll();
        window.dispatchEvent(new CustomEvent('vigma:update-layers'));
        window.dispatchEvent(new CustomEvent('vigma:save-history'));
        break;
      case 'back':
        canvas.sendObjectToBack(obj);
        canvas.requestRenderAll();
        window.dispatchEvent(new CustomEvent('vigma:update-layers'));
        window.dispatchEvent(new CustomEvent('vigma:save-history'));
        break;
      case 'lock':
        obj.selectable = !obj.selectable;
        obj.evented = obj.selectable;
        canvas.requestRenderAll();
        window.dispatchEvent(new CustomEvent('vigma:update-layers'));
        break;
      case 'hide':
        obj.visible = !obj.visible;
        canvas.requestRenderAll();
        window.dispatchEvent(new CustomEvent('vigma:update-layers'));
        break;
    }
  }, [canvasRef]);

  const handleDragStart = useCallback((_e: React.DragEvent, index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, _index: number) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const layers = [...state.layers];
    const objects = canvas.getObjects().filter(
      (obj) => (obj as unknown as Record<string, unknown>).customName !== undefined
    );
    
    const reversedDragIndex = layers.length - 1 - dragIndex;
    const reversedDropIndex = layers.length - 1 - dropIndex;
    
    const obj = objects[reversedDragIndex];
    if (!obj) return;
    
    // Move object to new z-index position
    canvas.remove(obj);
    const allObjs = canvas.getObjects();
    const insertAt = Math.min(reversedDropIndex, allObjs.length);
    canvas.insertAt(insertAt, obj);
    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:update-layers'));
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
    setDragIndex(null);
  }, [dragIndex, canvasRef, state.layers]);

  if (!state.leftSidebarOpen) {
    return (
      <div className="w-2 bg-[#252525] border-r border-[#3c3c3c] flex items-start pt-2 justify-center shrink-0">
        <button
          className="text-[#a0a0a0] hover:text-white cursor-pointer"
          onClick={() => dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' })}
        >
          <PanelLeftOpen size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 bg-[#252525] border-r border-[#3c3c3c] flex flex-col shrink-0 relative">
      <div className="h-9 flex items-center justify-between px-3">
        <span className="text-[#a0a0a0] text-xs font-semibold uppercase tracking-wider">Layers</span>
        <div className="flex items-center gap-1">
          <button
            className="text-[#a0a0a0] hover:text-white cursor-pointer"
            onClick={handleAddRect}
            title="Add Rectangle"
          >
            <Plus size={14} />
          </button>
          <button
            className="text-[#a0a0a0] hover:text-white cursor-pointer"
            onClick={() => dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' })}
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.layers.map((layer, index) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isSelected={state.selectedObjectIds.includes(layer.id)}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            index={index}
          />
        ))}
      </div>
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[#2c2c2c] border border-[#3c3c3c] rounded-md shadow-lg py-1 min-w-40"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {[
              { label: 'Duplicate', action: 'duplicate' },
              { label: 'Delete', action: 'delete' },
              { label: 'Bring to Front', action: 'front' },
              { label: 'Send to Back', action: 'back' },
              { label: '---', action: '' },
              { label: state.layers.find(l => l.id === contextMenu.id)?.locked ? 'Unlock' : 'Lock', action: 'lock' },
              { label: state.layers.find(l => l.id === contextMenu.id)?.visible ? 'Hide' : 'Show', action: 'hide' },
            ].map((item, i) =>
              item.label === '---' ? (
                <div key={i} className="border-t border-[#3c3c3c] my-1" />
              ) : (
                <button
                  key={i}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#d0d0d0] hover:bg-[#3c3c3c] cursor-pointer"
                  onClick={() => handleContextAction(item.action, contextMenu.id)}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
