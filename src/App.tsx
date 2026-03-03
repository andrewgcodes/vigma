import React, { useRef, useState, useCallback } from 'react';
import { AppProvider } from './store/canvasStore';
import Toolbar from './components/Toolbar/Toolbar';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import RightSidebar from './components/RightSidebar/RightSidebar';
import CanvasArea, { CanvasAreaHandle } from './components/Canvas/CanvasArea';
import ExportModal from './components/ExportModal/ExportModal';
import Toast from './components/Toast/Toast';
import { FabricObject } from 'fabric';
import { LayerInfo, ContextMenuOption } from './types';

function AppContent() {
  const canvasAreaRef = useRef<CanvasAreaHandle>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<FabricObject[]>([]);
  const [, setForceUpdate] = useState(0);

  const handleLayersChange = useCallback(() => {
    const newLayers = canvasAreaRef.current?.getLayers() || [];
    setLayers(newLayers);
  }, []);

  const handleSelectionChange = useCallback((objects: FabricObject[]) => {
    setSelectedObjects([...objects]);
    handleLayersChange();
  }, [handleLayersChange]);

  const handleContextMenu = useCallback((x: number, y: number, options: ContextMenuOption[]) => {
    // Context menu is handled inside CanvasArea
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <Toolbar
        canvasRef={canvasAreaRef}
        onImageUpload={() => canvasAreaRef.current?.triggerImageUpload()}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          layers={layers}
          onSelectLayer={(id) => canvasAreaRef.current?.selectObjectById(id)}
          onToggleVisibility={(id) => canvasAreaRef.current?.toggleObjectVisibility(id)}
          onToggleLock={(id) => canvasAreaRef.current?.toggleObjectLock(id)}
          onRenameLayer={(id, name) => canvasAreaRef.current?.renameObject(id, name)}
          onReorderLayer={(fromId, toId) => canvasAreaRef.current?.reorderObject(fromId, toId)}
          onAddRectangle={() => canvasAreaRef.current?.addRectangleAtRandom()}
          onContextMenu={(e, id) => {
            e.preventDefault();
            // Layer context menu is handled by layers panel itself
          }}
        />
        <CanvasArea
          ref={canvasAreaRef}
          onLayersChange={handleLayersChange}
          onSelectionChange={handleSelectionChange}
          onContextMenu={handleContextMenu}
        />
        <RightSidebar
          selectedObjects={selectedObjects}
          onPropertyChange={(prop, value) => canvasAreaRef.current?.setObjectProperty(prop, value)}
          onDuplicate={() => canvasAreaRef.current?.duplicateSelected()}
          onDelete={() => canvasAreaRef.current?.deleteSelected()}
          onBringToFront={() => canvasAreaRef.current?.bringToFront()}
          onSendToBack={() => canvasAreaRef.current?.sendToBack()}
          onGroup={() => canvasAreaRef.current?.groupSelected()}
          onUngroup={() => canvasAreaRef.current?.ungroupSelected()}
        />
      </div>
      <ExportModal canvas={canvasAreaRef.current?.getCanvas() ?? null} />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
