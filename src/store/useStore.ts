import { create } from "zustand";
import type { ToolType, LayerInfo, ContextMenuState } from "@/types";

interface DesignState {
  // Tool state
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Canvas state
  zoom: number;
  setZoom: (zoom: number) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;

  // Selected object
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;

  // Layers
  layers: LayerInfo[];
  setLayers: (layers: LayerInfo[]) => void;
  updateLayer: (id: string, updates: Partial<LayerInfo>) => void;

  // Object properties
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  cornerRadius: number;
  setCornerRadius: (radius: number) => void;

  // Text properties
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;

  // History
  canUndo: boolean;
  canRedo: boolean;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;

  // Pen drawing
  penColor: string;
  setPenColor: (color: string) => void;
  penWidth: number;
  setPenWidth: (width: number) => void;

  // Context menu
  contextMenu: ContextMenuState;
  setContextMenu: (menu: ContextMenuState) => void;

  // Clipboard
  clipboardData: string | null;
  setClipboardData: (data: string | null) => void;
}

export const useStore = create<DesignState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  zoom: 100,
  setZoom: (zoom) => set({ zoom }),
  isPanning: false,
  setIsPanning: (panning) => set({ isPanning: panning }),

  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  layers: [],
  setLayers: (layers) => set({ layers }),
  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  fillColor: "#4A90D9",
  setFillColor: (color) => set({ fillColor: color }),
  strokeColor: "#000000",
  setStrokeColor: (color) => set({ strokeColor: color }),
  strokeWidth: 0,
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  opacity: 100,
  setOpacity: (opacity) => set({ opacity }),
  cornerRadius: 0,
  setCornerRadius: (radius) => set({ cornerRadius: radius }),

  fontFamily: "Inter",
  setFontFamily: (font) => set({ fontFamily: font }),
  fontSize: 24,
  setFontSize: (size) => set({ fontSize: size }),
  fontWeight: "normal",
  setFontWeight: (weight) => set({ fontWeight: weight }),

  canUndo: false,
  canRedo: false,
  setCanUndo: (can) => set({ canUndo: can }),
  setCanRedo: (can) => set({ canRedo: can }),

  penColor: "#1d1d1f",
  setPenColor: (color) => set({ penColor: color }),
  penWidth: 2,
  setPenWidth: (width) => set({ penWidth: width }),

  contextMenu: { visible: false, x: 0, y: 0 },
  setContextMenu: (menu) => set({ contextMenu: menu }),

  clipboardData: null,
  setClipboardData: (data) => set({ clipboardData: data }),
}));
