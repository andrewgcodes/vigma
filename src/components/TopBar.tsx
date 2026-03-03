'use client';

import React, { useRef } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  FileJson,
  Image as ImageIcon,
  FileCode,
  Grid3x3,
  Magnet,
  Ruler,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  GalleryHorizontal,
  GalleryVertical,
  Trash2,
  Copy,
  Clipboard,
  Menu,
} from 'lucide-react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/store/useStore';
import { historyManager } from '@/utils/history';
import { exportToPNG, exportToSVG, exportToJSON, importFromJSON } from '@/utils/export';
import { alignObjects, distributeObjects } from '@/utils/alignment';

interface TopBarProps {
  fabricRef: React.RefObject<fabric.Canvas | null>;
}

export default function TopBar({ fabricRef }: TopBarProps) {
  const {
    canUndo,
    canRedo,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    showRulers,
    setShowRulers,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [showViewMenu, setShowViewMenu] = React.useState(false);
  const [showAlignMenu, setShowAlignMenu] = React.useState(false);
  const [showFileMenu, setShowFileMenu] = React.useState(false);

  const handleUndo = () => historyManager.undo();
  const handleRedo = () => historyManager.redo();

  const handleDelete = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length > 0) {
      active.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      historyManager.saveState();
    }
  };

  const handleCopy = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const cloned = await active.clone();
    (window as unknown as Record<string, unknown>).__vigma_clipboard = cloned;
  };

  const handlePaste = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const clipboard = (window as unknown as Record<string, unknown>).__vigma_clipboard as fabric.FabricObject | undefined;
    if (!clipboard) return;
    const cloned = await clipboard.clone();
    cloned.set({
      left: (cloned.left ?? 0) + 20,
      top: (cloned.top ?? 0) + 20,
    });
    const id = uuidv4();
    (cloned as fabric.FabricObject & { id?: string }).id = id;
    (cloned as fabric.FabricObject & { name?: string }).name = 'Copy';
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
    // Update clipboard so next paste cascades further
    (window as unknown as Record<string, unknown>).__vigma_clipboard = cloned;
    // syncLayers() already ran via the object:added event, no need for addLayer
    historyManager.saveState();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = fabricRef.current;
    if (!canvas || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgEl = document.createElement('img');
      imgEl.onload = () => {
        const img = new fabric.FabricImage(imgEl, {
          left: 100,
          top: 100,
        });
        const maxSize = 500;
        const scale = Math.min(maxSize / imgEl.width, maxSize / imgEl.height, 1);
        img.scale(scale);
        const id = uuidv4();
        (img as fabric.FabricObject & { id?: string }).id = id;
        (img as fabric.FabricObject & { name?: string }).name = file.name;
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        // syncLayers() already ran via the object:added event, no need for addLayer
        historyManager.saveState();
      };
      imgEl.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = fabricRef.current;
    if (!canvas || !e.target.files?.[0]) return;
    await importFromJSON(canvas, e.target.files[0]);
    historyManager.saveState();
    e.target.value = '';
  };

  const closeAllMenus = () => {
    setShowExportMenu(false);
    setShowViewMenu(false);
    setShowAlignMenu(false);
    setShowFileMenu(false);
  };

  return (
    <>
      {(showExportMenu || showViewMenu || showAlignMenu || showFileMenu) && (
        <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
      )}

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 px-2 py-1.5 flex items-center gap-1">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 mr-1">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="text-sm font-semibold text-gray-800 tracking-tight">Vigma</span>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowFileMenu(!showFileMenu); }}
              className="flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
            >
              <Menu size={14} />
              File
            </button>
            {showFileMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-200/60 py-1 z-50">
                <button
                  onClick={() => { imageInputRef.current?.click(); closeAllMenus(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon size={14} className="text-gray-400" />
                  Import Image
                </button>
                <button
                  onClick={() => { fileInputRef.current?.click(); closeAllMenus(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Upload size={14} className="text-gray-400" />
                  Open Project
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => { const c = fabricRef.current; if (c) exportToJSON(c); closeAllMenus(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileJson size={14} className="text-gray-400" />
                  Save Project
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>

          <div className="w-px h-6 bg-gray-200" />

          {/* Copy/Paste/Delete */}
          <button onClick={handleCopy} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Copy (Ctrl+C)">
            <Copy size={16} />
          </button>
          <button onClick={handlePaste} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Paste (Ctrl+V)">
            <Clipboard size={16} />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>

          <div className="w-px h-6 bg-gray-200" />

          {/* Align Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowAlignMenu(!showAlignMenu); }}
              className="flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
            >
              <AlignHorizontalJustifyCenter size={14} />
              Align
            </button>
            {showAlignMenu && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-200/60 py-1 z-50">
                <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Align</p>
                <button onClick={() => { const c = fabricRef.current; if (c) alignObjects(c, 'left'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <AlignHorizontalJustifyStart size={14} className="text-gray-400" /> Align Left
                </button>
                <button onClick={() => { const c = fabricRef.current; if (c) alignObjects(c, 'center-h'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <AlignHorizontalJustifyCenter size={14} className="text-gray-400" /> Align Center
                </button>
                <button onClick={() => { const c = fabricRef.current; if (c) alignObjects(c, 'right'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <AlignHorizontalJustifyEnd size={14} className="text-gray-400" /> Align Right
                </button>
                <button onClick={() => { const c = fabricRef.current; if (c) alignObjects(c, 'top'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <AlignVerticalJustifyStart size={14} className="text-gray-400" /> Align Top
                </button>
                <button onClick={() => { const c = fabricRef.current; if (c) alignObjects(c, 'center-v'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <AlignVerticalJustifyCenter size={14} className="text-gray-400" /> Align Middle
                </button>
                <button onClick={() => { const c = fabricRef.current; if (c) alignObjects(c, 'bottom'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <AlignVerticalJustifyEnd size={14} className="text-gray-400" /> Align Bottom
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Distribute</p>
                <button onClick={() => { const c = fabricRef.current; if (c) distributeObjects(c, 'horizontal'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <GalleryHorizontal size={14} className="text-gray-400" /> Distribute Horizontally
                </button>
                <button onClick={() => { const c = fabricRef.current; if (c) distributeObjects(c, 'vertical'); closeAllMenus(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <GalleryVertical size={14} className="text-gray-400" /> Distribute Vertically
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowViewMenu(!showViewMenu); }}
              className="flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
            >
              <Grid3x3 size={14} />
              View
            </button>
            {showViewMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-200/60 py-1 z-50">
                <button
                  onClick={() => { setShowGrid(!showGrid); closeAllMenus(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Grid3x3 size={14} className="text-gray-400" /> Grid
                  </span>
                  <span className={`w-3 h-3 rounded-full border-2 ${showGrid ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`} />
                </button>
                <button
                  onClick={() => { setSnapToGrid(!snapToGrid); closeAllMenus(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Magnet size={14} className="text-gray-400" /> Snap to Grid
                  </span>
                  <span className={`w-3 h-3 rounded-full border-2 ${snapToGrid ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`} />
                </button>
                <button
                  onClick={() => { setShowRulers(!showRulers); closeAllMenus(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Ruler size={14} className="text-gray-400" /> Rulers
                  </span>
                  <span className={`w-3 h-3 rounded-full border-2 ${showRulers ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`} />
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowExportMenu(!showExportMenu); }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium"
            >
              <Download size={14} />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-200/60 py-1 z-50">
                <button
                  onClick={() => { const c = fabricRef.current; if (c) exportToPNG(c); closeAllMenus(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon size={14} className="text-gray-400" />
                  Export as PNG
                </button>
                <button
                  onClick={() => { const c = fabricRef.current; if (c) exportToSVG(c); closeAllMenus(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileCode size={14} className="text-gray-400" />
                  Export as SVG
                </button>
                <button
                  onClick={() => { const c = fabricRef.current; if (c) exportToJSON(c); closeAllMenus(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileJson size={14} className="text-gray-400" />
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJSON}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </>
  );
}
