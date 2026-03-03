import { create } from 'zustand';
import type { ToolType, Page, HistoryEntry, ExportFormat, GuidelineData } from '@/types/design';

interface DesignState {
  // Tool state
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Canvas
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  showGrid: boolean;
  toggleGrid: () => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
  showRulers: boolean;
  toggleRulers: () => void;
  showGuides: boolean;
  toggleGuides: () => void;
  guidelines: GuidelineData[];
  addGuideline: (guide: GuidelineData) => void;
  removeGuideline: (index: number) => void;
  pixelGrid: boolean;
  togglePixelGrid: () => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;

  // Pages
  pages: Page[];
  currentPageId: string;
  setCurrentPage: (id: string) => void;
  addPage: (name: string) => void;
  renamePage: (id: string, name: string) => void;
  deletePage: (id: string) => void;

  // History
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;

  // UI State
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelTab: 'layers' | 'assets' | 'pages';
  rightPanelTab: 'design' | 'prototype' | 'export';
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: 'layers' | 'assets' | 'pages') => void;
  setRightPanelTab: (tab: 'design' | 'prototype' | 'export') => void;

  // Colors
  fillColor: string;
  strokeColor: string;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;

  // Stroke
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;

  // Font
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  lineHeight: number;
  letterSpacing: number;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: string) => void;
  setFontStyle: (style: string) => void;
  setTextAlign: (align: string) => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: number) => void;

  // Opacity
  opacity: number;
  setOpacity: (opacity: number) => void;

  // Corner radius
  cornerRadius: number;
  setCornerRadius: (radius: number) => void;

  // Blend mode
  blendMode: string;
  setBlendMode: (mode: string) => void;

  // Export
  exportFormat: ExportFormat;
  exportScale: number;
  setExportFormat: (format: ExportFormat) => void;
  setExportScale: (scale: number) => void;

  // Clipboard
  clipboard: string | null;
  setClipboard: (data: string | null) => void;

  // Context menu
  contextMenuPosition: { x: number; y: number } | null;
  setContextMenuPosition: (pos: { x: number; y: number } | null) => void;

  // Notifications
  notification: { message: string; type: 'info' | 'success' | 'error' } | null;
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearNotification: () => void;
}

export const useDesignStore = create<DesignState>((set, get) => ({
  // Tool
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Canvas
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.01, Math.min(64, zoom)) }),
  panOffset: { x: 0, y: 0 },
  setPanOffset: (offset) => set({ panOffset: offset }),
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  gridSize: 8,
  setGridSize: (size) => set({ gridSize: size }),
  snapToGrid: false,
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  showRulers: true,
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  showGuides: true,
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  guidelines: [],
  addGuideline: (guide) => set((s) => ({ guidelines: [...s.guidelines, guide] })),
  removeGuideline: (index) => set((s) => ({ guidelines: s.guidelines.filter((_, i) => i !== index) })),
  pixelGrid: false,
  togglePixelGrid: () => set((s) => ({ pixelGrid: !s.pixelGrid })),

  // Selection
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  // Pages
  pages: [{ id: 'page-1', name: 'Page 1' }],
  currentPageId: 'page-1',
  setCurrentPage: (id) => set({ currentPageId: id }),
  addPage: (name) => {
    const id = `page-${Date.now()}`;
    set((s) => ({ pages: [...s.pages, { id, name }], currentPageId: id }));
  },
  renamePage: (id, name) => set((s) => ({
    pages: s.pages.map((p) => p.id === id ? { ...p, name } : p),
  })),
  deletePage: (id) => {
    const state = get();
    if (state.pages.length <= 1) return;
    const remaining = state.pages.filter((p) => p.id !== id);
    set({
      pages: remaining,
      currentPageId: state.currentPageId === id ? remaining[0].id : state.currentPageId,
    });
  },

  // History
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  pushHistory: (entry) => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 100) newHistory.shift();
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  },
  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    set({
      historyIndex: state.historyIndex - 1,
      canUndo: state.historyIndex - 1 > 0,
      canRedo: true,
    });
  },
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    set({
      historyIndex: state.historyIndex + 1,
      canUndo: true,
      canRedo: state.historyIndex + 1 < state.history.length - 1,
    });
  },

  // UI
  leftPanelOpen: true,
  rightPanelOpen: true,
  leftPanelTab: 'layers',
  rightPanelTab: 'design',
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  // Colors
  fillColor: '#4A90D9',
  strokeColor: '#000000',
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeColor: (color) => set({ strokeColor: color }),

  // Stroke
  strokeWidth: 0,
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  // Font
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: '400',
  fontStyle: 'normal',
  textAlign: 'left',
  lineHeight: 1.2,
  letterSpacing: 0,
  setFontFamily: (family) => set({ fontFamily: family }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontWeight: (weight) => set({ fontWeight: weight }),
  setFontStyle: (style) => set({ fontStyle: style }),
  setTextAlign: (align) => set({ textAlign: align }),
  setLineHeight: (height) => set({ lineHeight: height }),
  setLetterSpacing: (spacing) => set({ letterSpacing: spacing }),

  // Opacity
  opacity: 100,
  setOpacity: (opacity) => set({ opacity }),

  // Corner radius
  cornerRadius: 0,
  setCornerRadius: (radius) => set({ cornerRadius: radius }),

  // Blend mode
  blendMode: 'normal',
  setBlendMode: (mode) => set({ blendMode: mode }),

  // Export
  exportFormat: 'png',
  exportScale: 1,
  setExportFormat: (format) => set({ exportFormat: format }),
  setExportScale: (scale) => set({ exportScale: scale }),

  // Clipboard
  clipboard: null,
  setClipboard: (data) => set({ clipboard: data }),

  // Context menu
  contextMenuPosition: null,
  setContextMenuPosition: (pos) => set({ contextMenuPosition: pos }),

  // Notifications
  notification: null,
  showNotification: (message, type = 'info') => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 3000);
  },
  clearNotification: () => set({ notification: null }),
}));
