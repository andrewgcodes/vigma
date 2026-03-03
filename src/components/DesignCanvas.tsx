'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import TopBar from './TopBar';
import Toolbar from './Toolbar';
import LayersPanel from './LayersPanel';
import PropertiesPanel from './PropertiesPanel';
import ShortcutsModal from './ShortcutsModal';

export default function DesignCanvas() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    canvasRef,
    initCanvas,
    deleteSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    duplicateSelected,
    selectAll,
    groupSelected,
    ungroupSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    undo,
    redo,
    exportCanvas,
    importImage,
    setObjectProperty,
    getActiveObjectProps,
    selectObjectById,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    zoomTo,
    zoomToFit,
  } = useCanvas();

  // Initialize canvas
  useEffect(() => {
    if (canvasElRef.current) {
      const cleanup = initCanvas(canvasElRef.current);
      return cleanup;
    }
  }, [initCanvas]);

  const handleImageImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        importImage(file);
        // Reset input so the same file can be imported again
        e.target.value = '';
      }
    },
    [importImage]
  );

  // Handle drag and drop for images
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        importImage(file);
      }
    },
    [importImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-gray-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hidden file input for image import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Bar */}
      <TopBar
        onUndo={undo}
        onRedo={redo}
        onExport={exportCanvas}
        onZoomTo={zoomTo}
        onZoomToFit={zoomToFit}
        onImportImage={handleImageImport}
      />

      {/* Canvas */}
      <canvas ref={canvasElRef} className="absolute inset-0" />

      {/* Layers Panel */}
      <LayersPanel
        onSelectLayer={selectObjectById}
        onToggleVisibility={toggleLayerVisibility}
        onToggleLock={toggleLayerLock}
        onRenameLayer={renameLayer}
      />

      {/* Properties Panel */}
      <PropertiesPanel
        getActiveObjectProps={getActiveObjectProps}
        setObjectProperty={setObjectProperty}
        canvasRef={canvasRef}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
      />

      {/* Toolbar */}
      <Toolbar onImageImport={handleImageImport} />

      {/* Shortcuts Modal */}
      <ShortcutsModal />
    </div>
  );
}
