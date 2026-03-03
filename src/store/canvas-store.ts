'use client';

import { create } from 'zustand';
import type { ToolType, CanvasObject, HistoryEntry } from '@/types';

interface CanvasStore {
  // Tool state
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Canvas objects
  objects: CanvasObject[];
  setObjects: (objects: CanvasObject[]) => void;
  selectedObjectIds: string[];
  setSelectedObjectIds: (ids: string[]) => void;

  // Zoom/Pan
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // UI state
  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
  gridSize: number;
  setGridSize: (size: number) => void;

  // Properties
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;
  fontStyle: string;
  setFontStyle: (style: string) => void;
  textAlign: string;
  setTextAlign: (align: string) => void;

  // Panels
  showLayers: boolean;
  toggleLayers: () => void;
  showProperties: boolean;
  toggleProperties: () => void;

  // Canvas background
  canvasBackground: string;
  setCanvasBackground: (color: string) => void;

  // Corner radius
  cornerRadius: number;
  setCornerRadius: (radius: number) => void;

  // Shadow
  shadowEnabled: boolean;
  setShadowEnabled: (enabled: boolean) => void;
  shadowColor: string;
  setShadowColor: (color: string) => void;
  shadowBlur: number;
  setShadowBlur: (blur: number) => void;
  shadowOffsetX: number;
  setShadowOffsetX: (x: number) => void;
  shadowOffsetY: number;
  setShadowOffsetY: (y: number) => void;

  // Cursor position
  cursorX: number;
  cursorY: number;
  setCursorPosition: (x: number, y: number) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Tool state
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Canvas objects
  objects: [],
  setObjects: (objects) => set({ objects }),
  selectedObjectIds: [],
  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),

  // Zoom/Pan
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  panOffset: { x: 0, y: 0 },
  setPanOffset: (offset) => set({ panOffset: offset }),

  // History
  history: [],
  historyIndex: -1,
  pushHistory: (entry) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    // Keep max 50 history entries
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { historyIndex } = get();
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 });
    }
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1 });
    }
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // UI
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  snapToGrid: false,
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  gridSize: 20,
  setGridSize: (size) => set({ gridSize: size }),

  // Properties
  fillColor: '#6366f1',
  setFillColor: (color) => set({ fillColor: color }),
  strokeColor: '#000000',
  setStrokeColor: (color) => set({ strokeColor: color }),
  strokeWidth: 0,
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  opacity: 1,
  setOpacity: (opacity) => set({ opacity }),
  fontSize: 24,
  setFontSize: (size) => set({ fontSize: size }),
  fontFamily: 'Inter',
  setFontFamily: (family) => set({ fontFamily: family }),
  fontWeight: 'normal',
  setFontWeight: (weight) => set({ fontWeight: weight }),
  fontStyle: 'normal',
  setFontStyle: (style) => set({ fontStyle: style }),
  textAlign: 'left',
  setTextAlign: (align) => set({ textAlign: align }),

  // Panels
  showLayers: true,
  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),
  showProperties: true,
  toggleProperties: () => set((s) => ({ showProperties: !s.showProperties })),

  // Canvas background
  canvasBackground: '#f8f9fa',
  setCanvasBackground: (color) => set({ canvasBackground: color }),

  // Corner radius
  cornerRadius: 0,
  setCornerRadius: (radius) => set({ cornerRadius: radius }),

  // Shadow
  shadowEnabled: false,
  setShadowEnabled: (enabled) => set({ shadowEnabled: enabled }),
  shadowColor: 'rgba(0,0,0,0.25)',
  setShadowColor: (color) => set({ shadowColor: color }),
  shadowBlur: 10,
  setShadowBlur: (blur) => set({ shadowBlur: blur }),
  shadowOffsetX: 0,
  setShadowOffsetX: (x) => set({ shadowOffsetX: x }),
  shadowOffsetY: 4,
  setShadowOffsetY: (y) => set({ shadowOffsetY: y }),

  // Cursor position
  cursorX: 0,
  cursorY: 0,
  setCursorPosition: (x, y) => set({ cursorX: x, cursorY: y }),
}));
