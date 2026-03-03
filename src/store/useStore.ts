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
  | 'pencil'
  | 'frame'
  | 'image';

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  children?: LayerInfo[];
}

export interface HistoryEntry {
  json: string;
  timestamp: number;
}

interface DesignState {
  // Tool state
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;

  // Layers
  layers: LayerInfo[];
  setLayers: (layers: LayerInfo[]) => void;

  // Canvas state
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;

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
  cornerRadius: number;
  setCornerRadius: (radius: number) => void;

  // History
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: (entry: HistoryEntry) => void;
  setHistoryIndex: (index: number) => void;

  // UI state
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  showRulers: boolean;
  setShowRulers: (show: boolean) => void;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
}

export const useStore = create<DesignState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  layers: [],
  setLayers: (layers) => set({ layers }),

  zoom: 100,
  setZoom: (zoom) => set({ zoom }),
  panOffset: { x: 0, y: 0 },
  setPanOffset: (offset) => set({ panOffset: offset }),

  fillColor: '#3b82f6',
  setFillColor: (color) => set({ fillColor: color }),
  strokeColor: '#000000',
  setStrokeColor: (color) => set({ strokeColor: color }),
  strokeWidth: 0,
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  opacity: 100,
  setOpacity: (opacity) => set({ opacity }),
  fontSize: 24,
  setFontSize: (size) => set({ fontSize: size }),
  fontFamily: 'Inter',
  setFontFamily: (family) => set({ fontFamily: family }),
  cornerRadius: 0,
  setCornerRadius: (radius) => set({ cornerRadius: radius }),

  history: [],
  historyIndex: -1,
  pushHistory: (entry) =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(entry);
      // Keep max 100 history entries
      if (newHistory.length > 100) newHistory.shift();
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),
  setHistoryIndex: (index) => set({ historyIndex: index }),

  showGrid: false,
  setShowGrid: (show) => set({ showGrid: show }),
  snapToGrid: false,
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  gridSize: 10,
  setGridSize: (size) => set({ gridSize: size }),
  showRulers: true,
  setShowRulers: (show) => set({ showRulers: show }),
  leftPanelOpen: true,
  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  rightPanelOpen: true,
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  showShortcuts: false,
  setShowShortcuts: (show) => set({ showShortcuts: show }),
}));
