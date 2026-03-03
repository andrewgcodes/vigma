'use client';

import React, { useState, useRef } from 'react';
import { useDesignStore } from '@/store/useDesignStore';
import {
  Menu, Undo2, Redo2, ZoomIn, ZoomOut, Maximize,
  Download, Upload, Save, FileJson, Image, FileText,
  Grid3X3, Ruler, Magnet, Eye, ChevronDown,
  Plus, Minus,
} from 'lucide-react';

interface TopBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onResetZoom: () => void;
  onExport: (format: string, scale?: number) => void;
  onImportJSON: (json: string) => void;
  onImportImage: (file: File) => void;
  onImportSVG: (svg: string) => void;
}

export default function TopBar({
  onUndo, onRedo, onZoomIn, onZoomOut, onZoomToFit, onResetZoom,
  onExport, onImportJSON, onImportImage, onImportSVG,
}: TopBarProps) {
  const zoom = useDesignStore((s) => s.zoom);
  const canUndo = useDesignStore((s) => s.canUndo);
  const canRedo = useDesignStore((s) => s.canRedo);
  const showGrid = useDesignStore((s) => s.showGrid);
  const showRulers = useDesignStore((s) => s.showRulers);
  const snapToGrid = useDesignStore((s) => s.snapToGrid);
  const toggleGrid = useDesignStore((s) => s.toggleGrid);
  const toggleRulers = useDesignStore((s) => s.toggleRulers);
  const toggleSnapToGrid = useDesignStore((s) => s.toggleSnapToGrid);
  const leftPanelOpen = useDesignStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useDesignStore((s) => s.rightPanelOpen);
  const toggleLeftPanel = useDesignStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = useDesignStore((s) => s.toggleRightPanel);

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      onImportImage(file);
    } else if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        onImportJSON(json);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const svg = ev.target?.result as string;
        onImportSVG(svg);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-12 bg-white/95 backdrop-blur-xl border-b border-canvas-border flex items-center justify-between px-4">
      {/* Left section */}
      <div className="flex items-center gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-canvas-accent to-blue-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-sm font-semibold text-canvas-text tracking-tight hidden sm:block">Vigma</span>
        </div>

        {/* File menu */}
        <div className="relative">
          <button
            onClick={() => { setShowFileMenu(!showFileMenu); setShowViewMenu(false); setShowExportMenu(false); }}
            className="px-3 py-1.5 text-xs text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover rounded-lg transition-colors"
          >
            File
          </button>
          {showFileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFileMenu(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-dropdown border border-canvas-border p-1 z-50 min-w-48">
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowFileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Upload size={14} /> Import Image
                </button>
                <button
                  onClick={() => { jsonInputRef.current?.click(); setShowFileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <FileJson size={14} /> Import JSON
                </button>
                <button
                  onClick={() => { svgInputRef.current?.click(); setShowFileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <FileText size={14} /> Import SVG
                </button>
                <div className="h-px bg-canvas-border my-1" />
                <button
                  onClick={() => { onExport('json'); setShowFileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Save size={14} /> Save as JSON
                  <span className="ml-auto text-2xs text-canvas-text-secondary">Cmd+S</span>
                </button>
                <div className="h-px bg-canvas-border my-1" />
                <button
                  onClick={() => { onExport('png'); setShowFileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Image size={14} /> Export as PNG
                  <span className="ml-auto text-2xs text-canvas-text-secondary">Cmd+E</span>
                </button>
                <button
                  onClick={() => { onExport('svg'); setShowFileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <FileText size={14} /> Export as SVG
                </button>
                <button
                  onClick={() => { onExport('pdf'); setShowFileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Download size={14} /> Export as PDF
                </button>
              </div>
            </>
          )}
        </div>

        {/* View menu */}
        <div className="relative">
          <button
            onClick={() => { setShowViewMenu(!showViewMenu); setShowFileMenu(false); setShowExportMenu(false); }}
            className="px-3 py-1.5 text-xs text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover rounded-lg transition-colors"
          >
            View
          </button>
          {showViewMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowViewMenu(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-dropdown border border-canvas-border p-1 z-50 min-w-48">
                <button
                  onClick={() => { toggleGrid(); setShowViewMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Grid3X3 size={14} /> Grid
                  {showGrid && <span className="ml-auto text-canvas-accent">On</span>}
                </button>
                <button
                  onClick={() => { toggleRulers(); setShowViewMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Ruler size={14} /> Rulers
                  {showRulers && <span className="ml-auto text-canvas-accent">On</span>}
                </button>
                <button
                  onClick={() => { toggleSnapToGrid(); setShowViewMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Magnet size={14} /> Snap to Grid
                  {snapToGrid && <span className="ml-auto text-canvas-accent">On</span>}
                </button>
                <div className="h-px bg-canvas-border my-1" />
                <button
                  onClick={() => { toggleLeftPanel(); setShowViewMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Eye size={14} /> Left Panel
                  {leftPanelOpen && <span className="ml-auto text-canvas-accent">On</span>}
                </button>
                <button
                  onClick={() => { toggleRightPanel(); setShowViewMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-canvas-text hover:bg-canvas-hover text-left"
                >
                  <Eye size={14} /> Right Panel
                  {rightPanelOpen && <span className="ml-auto text-canvas-accent">On</span>}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-canvas-border mx-2" />

        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-lg transition-colors ${canUndo ? 'text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover' : 'text-gray-300 cursor-not-allowed'}`}
          title="Undo (Cmd+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-lg transition-colors ${canRedo ? 'text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover' : 'text-gray-300 cursor-not-allowed'}`}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Center - Zoom controls */}
      <div className="flex items-center gap-1 bg-canvas-hover/50 rounded-lg px-1 py-0.5">
        <button
          onClick={onZoomOut}
          className="p-1 rounded text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover transition-colors"
          title="Zoom Out"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={onResetZoom}
          className="px-2 py-1 text-xs text-canvas-text hover:bg-canvas-hover rounded transition-colors min-w-12 text-center font-mono"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          className="p-1 rounded text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover transition-colors"
          title="Zoom In"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={onZoomToFit}
          className="p-1 rounded text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover transition-colors ml-1"
          title="Zoom to Fit (Cmd+1)"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onExport('png', 2)}
          className="px-3 py-1.5 text-xs bg-canvas-accent text-white rounded-lg hover:bg-canvas-accent-hover transition-colors shadow-sm"
        >
          Export
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileImport} />
      <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} />
      <input ref={svgInputRef} type="file" accept=".svg" className="hidden" onChange={handleFileImport} />
    </div>
  );
}
