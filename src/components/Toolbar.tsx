'use client';

import React, { useState, useRef } from 'react';
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  Star,
  Hexagon,
  Type,
  Pencil,
  ImagePlus,
  Download,
  Upload,
  Undo2,
  Redo2,
  Grid3X3,
  ChevronDown,
  FileJson,
  FileImage,
  FileCode,
  Palette,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { exportToPNG, exportToSVG, exportToJSON, importFromJSON } from '@/lib/canvas-utils';
import type { ToolType } from '@/types';
import type { Canvas } from 'fabric';

interface ToolbarProps {
  onAddShape: (tool: ToolType) => void;
  onImageUpload: () => void;
  canvas: React.RefObject<Canvas | null>;
}

export default function Toolbar({ onAddShape, onImageUpload, canvas }: ToolbarProps) {
  const {
    activeTool,
    setActiveTool,
    showGrid,
    toggleGrid,
    undo,
    redo,
    canvasColor,
    setCanvasColor,
    fillColor,
    setFillColor,
    strokeColor,
    setStrokeColor,
  } = useEditorStore();

  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);
    setShowShapeMenu(false);
  };

  const handleUndo = () => {
    const state = undo();
    if (state && canvas.current) {
      canvas.current.loadFromJSON(JSON.parse(state)).then(() => {
        canvas.current?.renderAll();
      });
    }
  };

  const handleRedo = () => {
    const state = redo();
    if (state && canvas.current) {
      canvas.current.loadFromJSON(JSON.parse(state)).then(() => {
        canvas.current?.renderAll();
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && canvas.current) {
        const text = await file.text();
        await importFromJSON(canvas.current, text);
      }
    };
    input.click();
    setShowExportMenu(false);
  };

  const shapeTools: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: 'rectangle', icon: <Square size={16} />, label: 'Rectangle' },
    { tool: 'circle', icon: <Circle size={16} />, label: 'Circle' },
    { tool: 'ellipse', icon: <Circle size={16} className="scale-x-125" />, label: 'Ellipse' },
    { tool: 'triangle', icon: <Triangle size={16} />, label: 'Triangle' },
    { tool: 'line', icon: <Minus size={16} />, label: 'Line' },
    { tool: 'arrow', icon: <ArrowRight size={16} />, label: 'Arrow' },
    { tool: 'star', icon: <Star size={16} />, label: 'Star' },
    { tool: 'polygon', icon: <Hexagon size={16} />, label: 'Polygon' },
  ];

  const currentShapeTool = shapeTools.find((s) => s.tool === activeTool);
  const isShapeTool = shapeTools.some((s) => s.tool === activeTool);

  return (
    <div className="flex items-center h-12 bg-toolbar-bg border-b border-panel-border px-2 gap-1 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mr-2">
        <div className="w-6 h-6 rounded bg-accent flex items-center justify-center font-bold text-xs">
          V
        </div>
        <span className="text-sm font-semibold text-text-primary hidden sm:inline">Vigma</span>
      </div>

      <div className="w-px h-6 bg-panel-border mx-1" />

      {/* History */}
      <button onClick={handleUndo} className="tool-btn" title="Undo (Ctrl+Z)">
        <Undo2 size={16} />
      </button>
      <button onClick={handleRedo} className="tool-btn" title="Redo (Ctrl+Shift+Z)">
        <Redo2 size={16} />
      </button>

      <div className="w-px h-6 bg-panel-border mx-1" />

      {/* Selection Tools */}
      <button
        onClick={() => handleToolClick('select')}
        className={`tool-btn ${activeTool === 'select' ? 'tool-btn-active' : ''}`}
        title="Select (V)"
      >
        <MousePointer2 size={16} />
      </button>
      <button
        onClick={() => handleToolClick('hand')}
        className={`tool-btn ${activeTool === 'hand' ? 'tool-btn-active' : ''}`}
        title="Hand / Pan (H)"
      >
        <Hand size={16} />
      </button>

      <div className="w-px h-6 bg-panel-border mx-1" />

      {/* Shape Tools with dropdown */}
      <div className="relative" ref={shapeMenuRef}>
        <div className="flex items-center">
          <button
            onClick={() => {
              if (isShapeTool) {
                onAddShape(activeTool);
              } else {
                handleToolClick('rectangle');
              }
            }}
            className={`tool-btn rounded-r-none ${isShapeTool ? 'tool-btn-active' : ''}`}
            title={currentShapeTool?.label || 'Rectangle'}
          >
            {currentShapeTool?.icon || <Square size={16} />}
          </button>
          <button
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            className={`tool-btn rounded-l-none w-4 ${isShapeTool ? 'tool-btn-active' : ''}`}
          >
            <ChevronDown size={10} />
          </button>
        </div>
        {showShapeMenu && (
          <div className="absolute top-full left-0 mt-1 bg-panel-bg border border-panel-border rounded-lg shadow-xl py-1 z-50 min-w-[160px]">
            {shapeTools.map((s) => (
              <button
                key={s.tool}
                onClick={() => {
                  handleToolClick(s.tool);
                  setShowShapeMenu(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-toolbar-hover text-left ${
                  activeTool === s.tool ? 'text-accent' : 'text-text-primary'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Tool */}
      <button
        onClick={() => handleToolClick('text')}
        className={`tool-btn ${activeTool === 'text' ? 'tool-btn-active' : ''}`}
        title="Text (T)"
      >
        <Type size={16} />
      </button>

      {/* Drawing Tool */}
      <button
        onClick={() => handleToolClick('draw')}
        className={`tool-btn ${activeTool === 'draw' ? 'tool-btn-active' : ''}`}
        title="Draw (P)"
      >
        <Pencil size={16} />
      </button>

      {/* Image Upload */}
      <button
        onClick={onImageUpload}
        className="tool-btn"
        title="Add Image"
      >
        <ImagePlus size={16} />
      </button>

      <div className="w-px h-6 bg-panel-border mx-1" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-6 h-6 cursor-pointer"
            title="Fill Color"
          />
        </div>
        <div className="relative">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-6 h-6 cursor-pointer"
            title="Stroke Color"
          />
        </div>
      </div>

      <div className="w-px h-6 bg-panel-border mx-1" />

      {/* Grid Toggle */}
      <button
        onClick={toggleGrid}
        className={`tool-btn ${showGrid ? 'tool-btn-active' : ''}`}
        title="Toggle Grid"
      >
        <Grid3X3 size={16} />
      </button>

      {/* Canvas Color */}
      <div className="relative flex items-center">
        <Palette size={14} className="text-text-muted mr-1" />
        <input
          type="color"
          value={canvasColor}
          onChange={(e) => setCanvasColor(e.target.value)}
          className="w-6 h-6 cursor-pointer"
          title="Canvas Background"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export/Import */}
      <div className="relative" ref={exportMenuRef}>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover rounded text-white text-sm font-medium transition-colors"
        >
          <Download size={14} />
          Export
          <ChevronDown size={12} />
        </button>
        {showExportMenu && (
          <div className="absolute top-full right-0 mt-1 bg-panel-bg border border-panel-border rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
            <button
              onClick={() => {
                if (canvas.current) exportToPNG(canvas.current);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-toolbar-hover text-text-primary text-left"
            >
              <FileImage size={16} />
              Export as PNG
            </button>
            <button
              onClick={() => {
                if (canvas.current) exportToSVG(canvas.current);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-toolbar-hover text-text-primary text-left"
            >
              <FileCode size={16} />
              Export as SVG
            </button>
            <button
              onClick={() => {
                if (canvas.current) exportToJSON(canvas.current);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-toolbar-hover text-text-primary text-left"
            >
              <FileJson size={16} />
              Export as JSON
            </button>
            <div className="h-px bg-panel-border my-1" />
            <button
              onClick={handleImport}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-toolbar-hover text-text-primary text-left"
            >
              <Upload size={16} />
              Import JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
