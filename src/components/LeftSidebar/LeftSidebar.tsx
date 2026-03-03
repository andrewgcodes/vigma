import React, { useState, useCallback } from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import LayerItem from './LayerItem';
import { useAppContext } from '../../store/canvasStore';
import { findObjectById, assignObjectId, assignDefaultName, saveCanvasJSON } from '../../utils/canvasHelpers';
import { v4 as uuidv4 } from 'uuid';

export default function LeftSidebar() {
  const { state, dispatch, canvasRef } = useAppContext();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPageName, setEditPageName] = useState('');
  const [pageMenuId, setPageMenuId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = findObjectById(canvas, id);
    if (obj) {
      // If this is a child inside a group, select the group for now
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toSelect = (obj as any).group ? ((obj as any).group as typeof obj) : obj;
      if (toSelect.selectable) {
        canvas.discardActiveObject();
        canvas.setActiveObject(toSelect);
        canvas.requestRenderAll();
      }
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

  const handleAddPage = useCallback(() => {
    const pageNum = state.pages.length + 1;
    const newPage = { id: uuidv4(), name: `Page ${pageNum}`, canvasJSON: null };
    // Save current page canvas state
    const canvas = canvasRef.current;
    if (canvas) {
      const json = saveCanvasJSON(canvas);
      dispatch({ type: 'UPDATE_PAGE_CANVAS', pageId: state.activePageId, canvasJSON: json });
    }
    dispatch({ type: 'ADD_PAGE', page: newPage });
    dispatch({ type: 'SET_ACTIVE_PAGE', pageId: newPage.id });
    // Clear canvas for new page
    if (canvas) {
      // Keep artboard, remove everything else
      canvas.getObjects().forEach((o) => {
        if ((o as unknown as Record<string, unknown>).customName !== undefined) {
          canvas.remove(o);
        }
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      window.dispatchEvent(new CustomEvent('vigma:update-layers'));
      window.dispatchEvent(new CustomEvent('vigma:save-history'));
    }
  }, [state.pages, state.activePageId, canvasRef, dispatch]);

  const handleSwitchPage = useCallback((pageId: string) => {
    if (pageId === state.activePageId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Save current page state
    const json = saveCanvasJSON(canvas);
    dispatch({ type: 'UPDATE_PAGE_CANVAS', pageId: state.activePageId, canvasJSON: json });
    // Switch to new page
    dispatch({ type: 'SET_ACTIVE_PAGE', pageId });
    const targetPage = state.pages.find((p) => p.id === pageId);
    if (targetPage?.canvasJSON) {
      const pageJSON = JSON.parse(targetPage.canvasJSON);
      canvas.loadFromJSON(pageJSON).then(() => {
        // Re-mark artboard as non-selectable after JSON restore (robust fallback)
        canvas.getObjects().forEach((obj) => {
          const record = obj as unknown as Record<string, unknown>;
          if (record.name === 'artboard' || (obj.width === 1200 && obj.height === 800 && obj.fill === '#ffffff' && !record.objectId)) {
            obj.selectable = false;
            obj.evented = false;
            obj.hoverCursor = 'default';
            record.name = 'artboard';
          }
        });
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('vigma:update-layers'));
        }, 100);
      });
    } else {
      // Empty page - remove all user objects
      canvas.getObjects().forEach((o) => {
        if ((o as unknown as Record<string, unknown>).customName !== undefined) {
          canvas.remove(o);
        }
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      window.dispatchEvent(new CustomEvent('vigma:update-layers'));
    }
  }, [state.activePageId, state.pages, canvasRef, dispatch]);

  const handleRenamePage = useCallback((pageId: string, name: string) => {
    dispatch({ type: 'RENAME_PAGE', pageId, name: name || 'Untitled' });
    setEditingPageId(null);
  }, [dispatch]);

  const handleDeletePage = useCallback((pageId: string) => {
    if (state.pages.length <= 1) return;
    setPageMenuId(null);
    // If deleting active page, switch first
    if (pageId === state.activePageId) {
      const otherPage = state.pages.find((p) => p.id !== pageId);
      if (otherPage) {
        handleSwitchPage(otherPage.id);
      }
    }
    dispatch({ type: 'DELETE_PAGE', pageId });
  }, [state.pages, state.activePageId, dispatch, handleSwitchPage]);

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
      {/* Pages Section */}
      <div className="border-b border-[#3c3c3c]">
        <div className="h-9 flex items-center justify-between px-3">
          <span className="text-[#a0a0a0] text-xs font-semibold uppercase tracking-wider">Pages</span>
          <div className="flex items-center gap-1">
            <button
              className="text-[#a0a0a0] hover:text-white cursor-pointer"
              onClick={handleAddPage}
              title="Add Page"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="max-h-32 overflow-y-auto">
          {state.pages.map((page) => (
            <div
              key={page.id}
              className={`group flex items-center gap-1.5 h-7 px-3 cursor-pointer select-none text-[12px] hover:bg-[#333333] transition-colors relative
                ${page.id === state.activePageId ? 'bg-[#7c5cfc33] text-white' : 'text-[#d0d0d0]'}
              `}
              onClick={() => handleSwitchPage(page.id)}
            >
              <FileText size={12} className="text-[#a0a0a0] shrink-0" />
              {editingPageId === page.id ? (
                <input
                  type="text"
                  value={editPageName}
                  onChange={(e) => setEditPageName(e.target.value)}
                  onBlur={() => handleRenamePage(page.id, editPageName)}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleRenamePage(page.id, editPageName); }}
                  className="bg-[#1e1e1e] text-white text-xs px-1 h-5 rounded border border-[#7c5cfc] outline-none flex-1 min-w-0"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="truncate flex-1 min-w-0"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingPageId(page.id);
                    setEditPageName(page.name);
                  }}
                >
                  {page.name}
                </span>
              )}
              <button
                className="text-[#a0a0a0] hover:text-white shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setPageMenuId(pageMenuId === page.id ? null : page.id);
                }}
              >
                <MoreHorizontal size={12} />
              </button>
              {pageMenuId === page.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPageMenuId(null)} />
                  <div className="absolute right-2 top-6 z-50 bg-[#2c2c2c] border border-[#3c3c3c] rounded-md shadow-lg py-1 min-w-28">
                    <button
                      className="w-full text-left px-3 py-1.5 text-xs text-[#d0d0d0] hover:bg-[#3c3c3c] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPageMenuId(null);
                        setEditingPageId(page.id);
                        setEditPageName(page.name);
                      }}
                    >
                      Rename
                    </button>
                    {state.pages.length > 1 && (
                      <button
                        className="w-full text-left px-3 py-1.5 text-xs text-[#ef4444] hover:bg-[#3c3c3c] cursor-pointer flex items-center gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Layers Section */}
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
