'use client';

import { create } from 'zustand';

export type ToolType =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'triangle'
  | 'star'
  | 'polygon'
  | 'text'
  | 'pen'
  | 'image'
  | 'eyedropper'
  | 'frame';

export interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

export interface CanvasState {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  previousTool: ToolType;
  setPreviousTool: (tool: ToolType) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  selectedObjectIds: string[];
  setSelectedObjectIds: (ids: string[]) => void;

  layers: LayerItem[];
  setLayers: (layers: LayerItem[]) => void;
  addLayer: (layer: LayerItem) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<LayerItem>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;

  fillColor: string;
  setFillColor: (color: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;
  textAlign: string;
  setTextAlign: (align: string) => void;

  canUndo: boolean;
  canRedo: boolean;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;

  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;

  showRulers: boolean;
  setShowRulers: (show: boolean) => void;

  canvasWidth: number;
  canvasHeight: number;
  setCanvasSize: (w: number, h: number) => void;

  // Context menu
  contextMenu: { x: number; y: number; objectId: string | null } | null;
  setContextMenu: (menu: { x: number; y: number; objectId: string | null } | null) => void;
}

export const useStore = create<CanvasState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set((state) => ({ activeTool: tool, previousTool: state.activeTool })),
  previousTool: 'select',
  setPreviousTool: (tool) => set({ previousTool: tool }),

  zoom: 100,
  setZoom: (zoom) => set({ zoom }),

  selectedObjectIds: [],
  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),

  layers: [],
  setLayers: (layers) => set({ layers }),
  addLayer: (layer) => set((state) => ({ layers: [layer, ...state.layers] })),
  removeLayer: (id) => set((state) => ({ layers: state.layers.filter((l) => l.id !== id) })),
  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const newLayers = [...state.layers];
      const [moved] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, moved);
      return { layers: newLayers };
    }),

  fillColor: '#4F46E5',
  setFillColor: (color) => set({ fillColor: color }),
  strokeColor: '#000000',
  setStrokeColor: (color) => set({ strokeColor: color }),
  strokeWidth: 1,
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  opacity: 100,
  setOpacity: (opacity) => set({ opacity }),
  borderRadius: 0,
  setBorderRadius: (radius) => set({ borderRadius: radius }),
  fontSize: 20,
  setFontSize: (size) => set({ fontSize: size }),
  fontFamily: 'Inter',
  setFontFamily: (family) => set({ fontFamily: family }),
  fontWeight: 'normal',
  setFontWeight: (weight) => set({ fontWeight: weight }),
  textAlign: 'left',
  setTextAlign: (align) => set({ textAlign: align }),

  canUndo: false,
  canRedo: false,
  setCanUndo: (can) => set({ canUndo: can }),
  setCanRedo: (can) => set({ canRedo: can }),

  showGrid: false,
  setShowGrid: (show) => set({ showGrid: show }),
  snapToGrid: false,
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  gridSize: 20,
  setGridSize: (size) => set({ gridSize: size }),

  showRulers: true,
  setShowRulers: (show) => set({ showRulers: show }),

  canvasWidth: 1920,
  canvasHeight: 1080,
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),

  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),
}));
