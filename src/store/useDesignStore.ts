import { create } from 'zustand'
import type {
  ToolType, FillConfig, StrokeConfig, ShadowConfig, TextStyle,
  BrushSettings, PageData, HistoryEntry, CanvasViewport, ExportSettings,
  LayerItem, GuideLineData, ThemeMode, SnapshotEntry, SavedComponent,
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
  leftPanelTab: 'layers' | 'pages' | 'assets' | 'comments' | 'snapshots'
  setLeftPanelTab: (tab: 'layers' | 'pages' | 'assets' | 'comments' | 'snapshots') => void
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

  // Theme (Feature 1)
  theme: ThemeMode
  toggleTheme: () => void

  // Recent Colors (Feature 3)
  recentColors: string[]
  addRecentColor: (color: string) => void

  // Canvas Background (Feature 4)
  canvasBackground: string
  setCanvasBackground: (color: string) => void

  // Keyboard Shortcuts Modal (Feature 6)
  showShortcutsModal: boolean
  setShowShortcutsModal: (show: boolean) => void

  // Snapshots (Feature 8)
  snapshots: SnapshotEntry[]
  addSnapshot: (snapshot: SnapshotEntry) => void
  removeSnapshot: (id: string) => void

  // Components / Symbols (Feature 10)
  savedComponents: SavedComponent[]
  addSavedComponent: (component: SavedComponent) => void
  removeSavedComponent: (id: string) => void
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

  // Theme (Feature 1)
  theme: 'light',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

  // Recent Colors (Feature 3)
  recentColors: [],
  addRecentColor: (color) => set((s) => {
    const filtered = s.recentColors.filter(c => c !== color)
    return { recentColors: [color, ...filtered].slice(0, 20) }
  }),

  // Canvas Background (Feature 4)
  canvasBackground: '#f5f5f7',
  setCanvasBackground: (color) => set({ canvasBackground: color }),

  // Keyboard Shortcuts Modal (Feature 6)
  showShortcutsModal: false,
  setShowShortcutsModal: (show) => set({ showShortcutsModal: show }),

  // Snapshots (Feature 8)
  snapshots: [],
  addSnapshot: (snapshot) => set((s) => ({ snapshots: [snapshot, ...s.snapshots].slice(0, 50) })),
  removeSnapshot: (id) => set((s) => ({ snapshots: s.snapshots.filter(snap => snap.id !== id) })),

  // Components / Symbols (Feature 10)
  savedComponents: [],
  addSavedComponent: (component) => set((s) => ({ savedComponents: [...s.savedComponents, component] })),
  removeSavedComponent: (id) => set((s) => ({ savedComponents: s.savedComponents.filter(c => c.id !== id) })),
}))
