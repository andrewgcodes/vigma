import { create } from 'zustand';
import type { ToolType, LayerInfo } from '@/types';

interface EditorState {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  selectedObjectIds: string[];
  setSelectedObjectIds: (ids: string[]) => void;

  layers: LayerInfo[];
  setLayers: (layers: LayerInfo[]) => void;
  updateLayer: (id: string, updates: Partial<LayerInfo>) => void;

  fillColor: string;
  setFillColor: (color: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;

  brushSize: number;
  setBrushSize: (size: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;

  canvasColor: string;
  setCanvasColor: (color: string) => void;

  showGrid: boolean;
  toggleGrid: () => void;

  history: string[];
  historyIndex: number;
  pushHistory: (state: string) => void;
  undo: () => string | null;
  redo: () => string | null;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  zoom: 100,
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),

  selectedObjectIds: [],
  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),

  layers: [],
  setLayers: (layers) => set({ layers }),
  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  fillColor: '#4A90D9',
  setFillColor: (color) => set({ fillColor: color }),
  strokeColor: '#000000',
  setStrokeColor: (color) => set({ strokeColor: color }),
  strokeWidth: 0,
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  brushSize: 3,
  setBrushSize: (size) => set({ brushSize: size }),
  brushColor: '#ffffff',
  setBrushColor: (color) => set({ brushColor: color }),

  canvasColor: '#1e1e1e',
  setCanvasColor: (color) => set({ canvasColor: color }),

  showGrid: false,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  history: [],
  historyIndex: -1,
  pushHistory: (state_str) =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(state_str);
      if (newHistory.length > 50) newHistory.shift();
      return { history: newHistory, historyIndex: newHistory.length - 1 };
    }),
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({ historyIndex: newIndex });
      return state.history[newIndex];
    }
    return null;
  },
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({ historyIndex: newIndex });
      return state.history[newIndex];
    }
    return null;
  },
}));
