import { create } from 'zustand'
import type {
  ToolType, FillConfig, StrokeConfig, ShadowConfig, TextStyle,
  BrushSettings, PageData, HistoryEntry, CanvasViewport, ExportSettings,
  LayerItem, GuideLineData,
} from '@/types/design'

interface DesignState {
  // Tool state
  activeTool: ToolType
  setActiveTool: (tool: ToolType) => void
  previousTool: ToolType
  setPreviousTool: (tool: ToolType) => void

  // Canvas
  canvasReady: boolean
  setCanvasReady: (ready: boolean) => void
  viewport: CanvasViewport
  setViewport: (viewport: Partial<CanvasViewport>) => void
  showGrid: boolean
  toggleGrid: () => void
  snapToGrid: boolean
  toggleSnapToGrid: () => void
  gridSize: number
  setGridSize: (size: number) => void
  showRulers: boolean
  toggleRulers: () => void
  showGuides: boolean
  toggleGuides: () => void
  guides: GuideLineData[]
  addGuide: (guide: GuideLineData) => void
  removeGuide: (id: string) => void

  // Selection
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void

  // Fill & Stroke
  fill: FillConfig
  setFill: (fill: Partial<FillConfig>) => void
  stroke: StrokeConfig
  setStroke: (stroke: Partial<StrokeConfig>) => void
  shadow: ShadowConfig
  setShadow: (shadow: Partial<ShadowConfig>) => void

  // Text
  textStyle: TextStyle
  setTextStyle: (style: Partial<TextStyle>) => void

  // Brush / Drawing
  brushSettings: BrushSettings
  setBrushSettings: (settings: Partial<BrushSettings>) => void

  // Layers
  layers: LayerItem[]
  setLayers: (layers: LayerItem[]) => void

  // Pages
  pages: PageData[]
  currentPageId: string
  setCurrentPageId: (id: string) => void
  addPage: (page: PageData) => void
  removePage: (id: string) => void
  updatePage: (id: string, data: Partial<PageData>) => void

  // History
  history: HistoryEntry[]
  historyIndex: number
  addHistory: (entry: HistoryEntry) => void
  setHistoryIndex: (index: number) => void
  clearHistory: () => void

  // Clipboard
  clipboard: string | null
  setClipboard: (data: string | null) => void

  // UI State
  leftPanelOpen: boolean
  toggleLeftPanel: () => void
  rightPanelOpen: boolean
  toggleRightPanel: () => void
  leftPanelTab: 'layers' | 'pages' | 'assets' | 'comments'
  setLeftPanelTab: (tab: 'layers' | 'pages' | 'assets' | 'comments') => void
  leftPanelWidth: number
  setLeftPanelWidth: (w: number) => void
  rightPanelWidth: number
  setRightPanelWidth: (w: number) => void

  // Object properties from selection
  selectedObjectProps: Record<string, any>
  setSelectedObjectProps: (props: Record<string, any>) => void

  // Zoom
  zoomToFit: boolean
  setZoomToFit: (fit: boolean) => void

  // Export
  exportSettings: ExportSettings
  setExportSettings: (settings: Partial<ExportSettings>) => void
  showExportDialog: boolean
  setShowExportDialog: (show: boolean) => void

  // Corner Radius
  cornerRadius: number
  setCornerRadius: (r: number) => void

  // Opacity
  objectOpacity: number
  setObjectOpacity: (o: number) => void

  // Blend Mode
  blendMode: string
  setBlendMode: (mode: string) => void

  // Alignment
  lastAlignAction: string | null
  setLastAlignAction: (action: string | null) => void

  // Feature 51: Dark mode toggle
  darkMode: boolean
  toggleDarkMode: () => void

  // Feature 52: Show pixel grid toggle
  showPixelGrid: boolean
  togglePixelGrid: () => void

  // Feature 53: Auto save enabled toggle
  autoSaveEnabled: boolean
  toggleAutoSave: () => void

  // Feature 54: Show object info overlay
  showObjectInfo: boolean
  toggleObjectInfo: () => void

  // Feature 55: Recent colors
  recentColors: string[]
  addRecentColor: (color: string) => void

  // Feature 56: Grid color
  gridColor: string
  setGridColor: (color: string) => void

  // Feature 57: Canvas background color
  canvasBackground: string
  setCanvasBackground: (color: string) => void

  // Feature 58: Show selection dimensions
  showSelectionDimensions: boolean
  toggleSelectionDimensions: () => void

  // Feature 59: Show distance guides
  showDistanceGuides: boolean
  toggleDistanceGuides: () => void

  // Feature 60: Keyboard shortcuts enabled
  keyboardShortcutsEnabled: boolean
  toggleKeyboardShortcuts: () => void

  // Feature 61: Show keyboard shortcuts dialog
  showKeyboardShortcuts: boolean
  setShowKeyboardShortcuts: (show: boolean) => void

  // Feature 62: Show minimap
  showMinimap: boolean
  toggleMinimap: () => void

  // Feature 63: Notification toast
  toastMessage: string | null
  toastType: 'info' | 'success' | 'warning' | 'error'
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  clearToast: () => void

  // Feature 64: Cursor coordinates
  cursorPosition: { x: number; y: number }
  setCursorPosition: (pos: { x: number; y: number }) => void

  // Feature 65: Search layers query
  layerSearchQuery: string
  setLayerSearchQuery: (query: string) => void

  // Feature 66: Workspace info visible
  showWorkspaceInfo: boolean
  toggleWorkspaceInfo: () => void

  // Feature 67: Auto select after creation
  autoSelectAfterCreate: boolean
  toggleAutoSelectAfterCreate: () => void

  // Feature 68: Show status bar
  showStatusBar: boolean
  toggleStatusBar: () => void

  // Feature 69: Snap to objects
  snapToObjects: boolean
  toggleSnapToObjects: () => void

  // Feature 70: Zoom slider value (for continuous zoom)
  zoomSliderValue: number
  setZoomSliderValue: (value: number) => void
}

const defaultPageId = 'page-1'

export const useDesignStore = create<DesignState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set((s) => ({ activeTool: tool, previousTool: s.activeTool })),
  previousTool: 'select',
  setPreviousTool: (tool) => set({ previousTool: tool }),

  canvasReady: false,
  setCanvasReady: (ready) => set({ canvasReady: ready }),
  viewport: { zoom: 1, panX: 0, panY: 0 },
  setViewport: (viewport) => set((s) => ({ viewport: { ...s.viewport, ...viewport } })),
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  snapToGrid: false,
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  gridSize: 10,
  setGridSize: (size) => set({ gridSize: size }),
  showRulers: true,
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  showGuides: true,
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  guides: [],
  addGuide: (guide) => set((s) => ({ guides: [...s.guides, guide] })),
  removeGuide: (id) => set((s) => ({ guides: s.guides.filter(g => g.id !== id) })),

  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  fill: { type: 'solid', color: '#4A90D9', opacity: 1 },
  setFill: (fill) => set((s) => ({ fill: { ...s.fill, ...fill } })),
  stroke: { color: '#000000', width: 0, opacity: 1, dashArray: [], lineCap: 'round', lineJoin: 'round' },
  setStroke: (stroke) => set((s) => ({ stroke: { ...s.stroke, ...stroke } })),
  shadow: { color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 0, offsetY: 4, enabled: false },
  setShadow: (shadow) => set((s) => ({ shadow: { ...s.shadow, ...shadow } })),

  textStyle: { fontFamily: 'Inter', fontSize: 20, fontWeight: 'normal', fontStyle: 'normal', underline: false, linethrough: false, overline: false, textAlign: 'left', lineHeight: 1.2, charSpacing: 0, fill: '#1d1d1f' },
  setTextStyle: (style) => set((s) => ({ textStyle: { ...s.textStyle, ...style } })),

  brushSettings: { type: 'pencil', width: 3, color: '#1d1d1f', opacity: 1, shadowBlur: 0, shadowColor: 'rgba(0,0,0,0)' },
  setBrushSettings: (settings) => set((s) => ({ brushSettings: { ...s.brushSettings, ...settings } })),

  layers: [],
  setLayers: (layers) => set({ layers }),

  pages: [{ id: defaultPageId, name: 'Page 1', canvasJSON: '' }],
  currentPageId: defaultPageId,
  setCurrentPageId: (id) => set({ currentPageId: id }),
  addPage: (page) => set((s) => ({ pages: [...s.pages, page] })),
  removePage: (id) => set((s) => ({ pages: s.pages.filter(p => p.id !== id) })),
  updatePage: (id, data) => set((s) => ({
    pages: s.pages.map(p => p.id === id ? { ...p, ...data } : p),
  })),

  history: [],
  historyIndex: -1,
  addHistory: (entry) => set((s) => {
    const newHistory = s.history.slice(0, s.historyIndex + 1)
    newHistory.push(entry)
    if (newHistory.length > 100) newHistory.shift()
    return { history: newHistory, historyIndex: newHistory.length - 1 }
  }),
  setHistoryIndex: (index) => set({ historyIndex: index }),
  clearHistory: () => set({ history: [], historyIndex: -1 }),

  clipboard: null,
  setClipboard: (data) => set({ clipboard: data }),

  leftPanelOpen: true,
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  rightPanelOpen: true,
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  leftPanelTab: 'layers',
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  leftPanelWidth: 240,
  setLeftPanelWidth: (w) => set({ leftPanelWidth: Math.max(180, Math.min(480, w)) }),
  rightPanelWidth: 256,
  setRightPanelWidth: (w) => set({ rightPanelWidth: Math.max(200, Math.min(500, w)) }),

  selectedObjectProps: {},
  setSelectedObjectProps: (props) => set({ selectedObjectProps: props }),

  zoomToFit: false,
  setZoomToFit: (fit) => set({ zoomToFit: fit }),

  exportSettings: { format: 'png', scale: 2, quality: 1, background: true, selectedOnly: false },
  setExportSettings: (settings) => set((s) => ({ exportSettings: { ...s.exportSettings, ...settings } })),
  showExportDialog: false,
  setShowExportDialog: (show) => set({ showExportDialog: show }),

  cornerRadius: 0,
  setCornerRadius: (r) => set({ cornerRadius: r }),

  objectOpacity: 1,
  setObjectOpacity: (o) => set({ objectOpacity: o }),

  blendMode: 'normal',
  setBlendMode: (mode) => set({ blendMode: mode }),

  lastAlignAction: null,
  setLastAlignAction: (action) => set({ lastAlignAction: action }),

  // Feature 51: Dark mode
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

  // Feature 52: Pixel grid
  showPixelGrid: false,
  togglePixelGrid: () => set((s) => ({ showPixelGrid: !s.showPixelGrid })),

  // Feature 53: Auto save
  autoSaveEnabled: true,
  toggleAutoSave: () => set((s) => ({ autoSaveEnabled: !s.autoSaveEnabled })),

  // Feature 54: Object info overlay
  showObjectInfo: false,
  toggleObjectInfo: () => set((s) => ({ showObjectInfo: !s.showObjectInfo })),

  // Feature 55: Recent colors
  recentColors: [],
  addRecentColor: (color) => set((s) => {
    const filtered = s.recentColors.filter(c => c !== color)
    return { recentColors: [color, ...filtered].slice(0, 12) }
  }),

  // Feature 56: Grid color
  gridColor: '#e0e0e0',
  setGridColor: (color) => set({ gridColor: color }),

  // Feature 57: Canvas background
  canvasBackground: '#f5f5f7',
  setCanvasBackground: (color) => set({ canvasBackground: color }),

  // Feature 58: Selection dimensions
  showSelectionDimensions: true,
  toggleSelectionDimensions: () => set((s) => ({ showSelectionDimensions: !s.showSelectionDimensions })),

  // Feature 59: Distance guides
  showDistanceGuides: false,
  toggleDistanceGuides: () => set((s) => ({ showDistanceGuides: !s.showDistanceGuides })),

  // Feature 60: Keyboard shortcuts
  keyboardShortcutsEnabled: true,
  toggleKeyboardShortcuts: () => set((s) => ({ keyboardShortcutsEnabled: !s.keyboardShortcutsEnabled })),

  // Feature 61: Keyboard shortcuts dialog
  showKeyboardShortcuts: false,
  setShowKeyboardShortcuts: (show) => set({ showKeyboardShortcuts: show }),

  // Feature 62: Minimap
  showMinimap: false,
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),

  // Feature 63: Toast notifications
  toastMessage: null,
  toastType: 'info',
  showToast: (message, type = 'info') => set({ toastMessage: message, toastType: type }),
  clearToast: () => set({ toastMessage: null }),

  // Feature 64: Cursor position
  cursorPosition: { x: 0, y: 0 },
  setCursorPosition: (pos) => set({ cursorPosition: pos }),

  // Feature 65: Layer search
  layerSearchQuery: '',
  setLayerSearchQuery: (query) => set({ layerSearchQuery: query }),

  // Feature 66: Workspace info
  showWorkspaceInfo: false,
  toggleWorkspaceInfo: () => set((s) => ({ showWorkspaceInfo: !s.showWorkspaceInfo })),

  // Feature 67: Auto select after creation
  autoSelectAfterCreate: true,
  toggleAutoSelectAfterCreate: () => set((s) => ({ autoSelectAfterCreate: !s.autoSelectAfterCreate })),

  // Feature 68: Status bar
  showStatusBar: true,
  toggleStatusBar: () => set((s) => ({ showStatusBar: !s.showStatusBar })),

  // Feature 69: Snap to objects
  snapToObjects: false,
  toggleSnapToObjects: () => set((s) => ({ snapToObjects: !s.snapToObjects })),

  // Feature 70: Zoom slider
  zoomSliderValue: 100,
  setZoomSliderValue: (value) => set({ zoomSliderValue: value }),
}))
