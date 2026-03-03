'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Magnet,
  Layers,
  Settings2,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Copy,
  Trash2,
  Group,
  Ungroup,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Clipboard,
  Scissors,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { canvasEngine } from '@/lib/canvas-engine';

export default function TopBar() {
  const {
    zoom, setZoom,
    showGrid, toggleGrid,
    snapToGrid, toggleSnapToGrid,
    showLayers, toggleLayers,
    showProperties, toggleProperties,
    history, historyIndex, undo, redo,
    selectedObjectIds,
  } = useCanvasStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (alignRef.current && !alignRef.current.contains(event.target as Node)) {
        setShowAlignMenu(false);
      }
      if (viewRef.current && !viewRef.current.contains(event.target as Node)) {
        setShowViewMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: string) => {
    setShowExportMenu(false);
    let data: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'png':
        data = canvasEngine.exportToPNG(2);
        downloadFile(data, 'vigma-export.png');
        return;
      case 'png-1x':
        data = canvasEngine.exportToPNG(1);
        downloadFile(data, 'vigma-export-1x.png');
        return;
      case 'png-3x':
        data = canvasEngine.exportToPNG(3);
        downloadFile(data, 'vigma-export-3x.png');
        return;
      case 'svg':
        data = canvasEngine.exportToSVG();
        mimeType = 'image/svg+xml';
        filename = 'vigma-export.svg';
        break;
      case 'json':
        data = canvasEngine.exportToJSON();
        mimeType = 'application/json';
        filename = 'vigma-export.json';
        break;
      default:
        return;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
    URL.revokeObjectURL(url);
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const json = ev.target?.result as string;
          canvasEngine.importFromJSON(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleImportImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          canvasEngine.addImage(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleUndo = () => {
    undo();
    const entry = history[historyIndex - 1];
    if (entry) {
      canvasEngine.restoreFromHistory(entry.json);
    }
  };

  const handleRedo = () => {
    redo();
    const entry = history[historyIndex + 1];
    if (entry) {
      canvasEngine.restoreFromHistory(entry.json);
    }
  };

  const hasSelection = selectedObjectIds.length > 0;
  const hasMultipleSelection = selectedObjectIds.length > 1;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <span className="brand-name">Vigma</span>
        </div>

        <div className="topbar-divider" />

        {/* Undo / Redo */}
        <button
          className="topbar-btn"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="topbar-btn"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </button>

        <div className="topbar-divider" />

        {/* Object Actions */}
        {hasSelection && (
          <>
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.copyToClipboard()}
              title="Copy (Ctrl+C)"
            >
              <Copy size={16} />
            </button>
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.pasteFromClipboard()}
              title="Paste (Ctrl+V)"
            >
              <Clipboard size={16} />
            </button>
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.duplicateSelected()}
              title="Duplicate (Ctrl+D)"
            >
              <Scissors size={16} />
            </button>
            <button
              className="topbar-btn danger"
              onClick={() => canvasEngine.deleteSelected()}
              title="Delete (Del)"
            >
              <Trash2 size={16} />
            </button>

            <div className="topbar-divider" />

            {/* Layer ordering */}
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.bringToFront()}
              title="Bring to Front"
            >
              <ArrowUpToLine size={16} />
            </button>
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.bringForward()}
              title="Bring Forward"
            >
              <ArrowUp size={16} />
            </button>
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.sendBackward()}
              title="Send Backward"
            >
              <ArrowDown size={16} />
            </button>
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.sendToBack()}
              title="Send to Back"
            >
              <ArrowDownToLine size={16} />
            </button>

            <div className="topbar-divider" />

            {/* Group/Ungroup */}
            {hasMultipleSelection && (
              <button
                className="topbar-btn"
                onClick={() => canvasEngine.groupSelected()}
                title="Group (Ctrl+G)"
              >
                <Group size={16} />
              </button>
            )}
            <button
              className="topbar-btn"
              onClick={() => canvasEngine.ungroupSelected()}
              title="Ungroup (Ctrl+Shift+G)"
            >
              <Ungroup size={16} />
            </button>

            <div className="topbar-divider" />

            {/* Alignment */}
            <div className="topbar-dropdown" ref={alignRef}>
              <button
                className="topbar-btn"
                onClick={() => setShowAlignMenu(!showAlignMenu)}
                title="Align"
              >
                <AlignCenterHorizontal size={16} />
              </button>
              {showAlignMenu && (
                <div className="dropdown-menu">
                  <button onClick={() => { canvasEngine.alignObjects('left'); setShowAlignMenu(false); }}>
                    <AlignStartHorizontal size={14} /> Align Left
                  </button>
                  <button onClick={() => { canvasEngine.alignObjects('center-h'); setShowAlignMenu(false); }}>
                    <AlignCenterHorizontal size={14} /> Align Center
                  </button>
                  <button onClick={() => { canvasEngine.alignObjects('right'); setShowAlignMenu(false); }}>
                    <AlignEndHorizontal size={14} /> Align Right
                  </button>
                  <div className="dropdown-divider" />
                  <button onClick={() => { canvasEngine.alignObjects('top'); setShowAlignMenu(false); }}>
                    <AlignStartVertical size={14} /> Align Top
                  </button>
                  <button onClick={() => { canvasEngine.alignObjects('center-v'); setShowAlignMenu(false); }}>
                    <AlignCenterVertical size={14} /> Align Middle
                  </button>
                  <button onClick={() => { canvasEngine.alignObjects('bottom'); setShowAlignMenu(false); }}>
                    <AlignEndVertical size={14} /> Align Bottom
                  </button>
                  <div className="dropdown-divider" />
                  <button onClick={() => { canvasEngine.distributeObjects('horizontal'); setShowAlignMenu(false); }}>
                    Distribute Horizontally
                  </button>
                  <button onClick={() => { canvasEngine.distributeObjects('vertical'); setShowAlignMenu(false); }}>
                    Distribute Vertically
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="topbar-right">
        {/* View Controls */}
        <div className="topbar-dropdown" ref={viewRef}>
          <button
            className="topbar-btn"
            onClick={() => setShowViewMenu(!showViewMenu)}
            title="View Options"
          >
            <Settings2 size={16} />
          </button>
          {showViewMenu && (
            <div className="dropdown-menu right-aligned">
              <button onClick={() => { toggleGrid(); setShowViewMenu(false); }}>
                <Grid3x3 size={14} /> {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
              <button onClick={() => { toggleSnapToGrid(); setShowViewMenu(false); }}>
                <Magnet size={14} /> {snapToGrid ? 'Disable Snap' : 'Enable Snap'}
              </button>
              <div className="dropdown-divider" />
              <button onClick={() => { toggleLayers(); setShowViewMenu(false); }}>
                <Layers size={14} /> {showLayers ? 'Hide Layers' : 'Show Layers'}
              </button>
              <button onClick={() => { toggleProperties(); setShowViewMenu(false); }}>
                <Settings2 size={14} /> {showProperties ? 'Hide Properties' : 'Show Properties'}
              </button>
            </div>
          )}
        </div>

        <div className="topbar-divider" />

        {/* Zoom Controls */}
        <button className="topbar-btn" onClick={() => canvasEngine.zoomOut()} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <span className="zoom-level" onClick={() => { canvasEngine.zoomToFit(); setZoom(1); }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="topbar-btn" onClick={() => canvasEngine.zoomIn()} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="topbar-btn" onClick={() => { canvasEngine.zoomToFit(); setZoom(1); }} title="Fit to Screen">
          <Maximize2 size={16} />
        </button>

        <div className="topbar-divider" />

        {/* Import */}
        <button className="topbar-btn" onClick={handleImportImage} title="Import Image">
          <Upload size={16} />
        </button>

        {/* Export */}
        <div className="topbar-dropdown" ref={exportRef}>
          <button
            className="topbar-btn accent"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          {showExportMenu && (
            <div className="dropdown-menu right-aligned">
              <button onClick={() => handleExport('png')}>PNG (2x)</button>
              <button onClick={() => handleExport('png-1x')}>PNG (1x)</button>
              <button onClick={() => handleExport('png-3x')}>PNG (3x)</button>
              <div className="dropdown-divider" />
              <button onClick={() => handleExport('svg')}>SVG</button>
              <div className="dropdown-divider" />
              <button onClick={() => handleExport('json')}>JSON (project)</button>
              <button onClick={handleImportJSON}>Import JSON...</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
