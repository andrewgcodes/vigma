'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';

interface TopBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onExport: (format: 'png' | 'svg' | 'jpg', scale?: number) => void;
  onZoomTo: (level: number) => void;
  onZoomToFit: () => void;
  onImportImage: () => void;
}

export default function TopBar({
  onUndo,
  onRedo,
  onExport,
  onZoomTo,
  onZoomToFit,
  onImportImage,
}: TopBarProps) {
  const { zoom, history, historyIndex, showGrid, setShowGrid, snapToGrid, setSnapToGrid, showRulers, setShowRulers } = useStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) {
        setShowViewMenu(false);
      }
      if (fileRef.current && !fileRef.current.contains(e.target as Node)) {
        setShowFileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-4">
      {/* Left: Logo + File menu */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">Vigma</span>
        </div>

        {/* File Menu */}
        <div ref={fileRef} className="relative">
          <button
            onClick={() => { setShowFileMenu(!showFileMenu); setShowViewMenu(false); setShowExportMenu(false); }}
            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            File
          </button>
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg shadow-black/10 border border-gray-200/60 py-1 overflow-hidden">
              <button
                onClick={() => { onImportImage(); setShowFileMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>Import Image</span>
                <span className="text-gray-400 text-[10px]">-</span>
              </button>
              <div className="h-px bg-gray-100 mx-2 my-1" />
              <button
                onClick={() => { setShowFileMenu(false); setShowExportMenu(true); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>Export...</span>
                <span className="text-gray-400 text-[10px]">-</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div ref={viewRef} className="relative">
          <button
            onClick={() => { setShowViewMenu(!showViewMenu); setShowFileMenu(false); setShowExportMenu(false); }}
            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            View
          </button>
          {showViewMenu && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg shadow-black/10 border border-gray-200/60 py-1 overflow-hidden">
              <button
                onClick={() => { setShowGrid(!showGrid); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>Show Grid</span>
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${showGrid ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                  {showGrid ? '✓' : ''}
                </span>
              </button>
              <button
                onClick={() => { setSnapToGrid(!snapToGrid); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>Snap to Grid</span>
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${snapToGrid ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                  {snapToGrid ? '✓' : ''}
                </span>
              </button>
              <button
                onClick={() => { setShowRulers(!showRulers); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>Show Rulers</span>
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${showRulers ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                  {showRulers ? '✓' : ''}
                </span>
              </button>
              <div className="h-px bg-gray-100 mx-2 my-1" />
              <button
                onClick={() => { onZoomToFit(); setShowViewMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>Zoom to Fit</span>
                <span className="text-gray-400 text-[10px]">Ctrl+0</span>
              </button>
              <button
                onClick={() => { onZoomTo(100); setShowViewMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>Zoom to 100%</span>
                <span className="text-gray-400 text-[10px]">Ctrl+1</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo */}
      <div className="flex-1 flex items-center justify-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${canUndo ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-colors ${canRedo ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Right: Zoom + Export */}
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
          <button
            onClick={() => onZoomTo(Math.max(10, zoom - 10))}
            className="p-1 text-gray-500 hover:text-gray-800 rounded transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="text-[11px] text-gray-600 font-medium w-10 text-center tabular-nums">{zoom}%</span>
          <button
            onClick={() => onZoomTo(Math.min(500, zoom + 10))}
            className="p-1 text-gray-500 hover:text-gray-800 rounded transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Export button */}
        <div ref={exportRef} className="relative">
          <button
            onClick={() => { setShowExportMenu(!showExportMenu); setShowFileMenu(false); setShowViewMenu(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg shadow-black/10 border border-gray-200/60 py-1 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider">Format</div>
              <button
                onClick={() => { onExport('png', 1); setShowExportMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>PNG (1x)</span>
              </button>
              <button
                onClick={() => { onExport('png', 2); setShowExportMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>PNG (2x)</span>
              </button>
              <button
                onClick={() => { onExport('png', 3); setShowExportMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>PNG (3x)</span>
              </button>
              <div className="h-px bg-gray-100 mx-2 my-1" />
              <button
                onClick={() => { onExport('svg'); setShowExportMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>SVG</span>
              </button>
              <button
                onClick={() => { onExport('jpg', 1); setShowExportMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>JPG</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
