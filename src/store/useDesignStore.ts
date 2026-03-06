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

  // ===== Features 301-400: Additional Store State =====

  // Feature 301: Show command palette
  showCommandPalette: boolean
  setShowCommandPalette: (show: boolean) => void

  // Feature 302: Show find and replace dialog
  showFindReplace: boolean
  setShowFindReplace: (show: boolean) => void

  // Feature 303: Find text query
  findQuery: string
  setFindQuery: (query: string) => void

  // Feature 304: Replace text query
  replaceQuery: string
  setReplaceQuery: (query: string) => void

  // Feature 305: Default fill color for new objects
  defaultFillColor: string
  setDefaultFillColor: (color: string) => void

  // Feature 306: Default stroke color for new objects
  defaultStrokeColor: string
  setDefaultStrokeColor: (color: string) => void

  // Feature 307: Default stroke width for new objects
  defaultStrokeWidth: number
  setDefaultStrokeWidth: (width: number) => void

  // Feature 308: Default font family
  defaultFontFamily: string
  setDefaultFontFamily: (font: string) => void

  // Feature 309: Default font size
  defaultFontSize: number
  setDefaultFontSize: (size: number) => void

  // Feature 310: Ruler units
  rulerUnits: 'px' | 'in' | 'cm' | 'mm' | 'pt'
  setRulerUnits: (units: 'px' | 'in' | 'cm' | 'mm' | 'pt') => void

  // Feature 311: Snap tolerance/threshold
  snapTolerance: number
  setSnapTolerance: (tolerance: number) => void

  // Feature 312: Guide color
  guideColor: string
  setGuideColor: (color: string) => void

  // Feature 313: Show alignment guides on move
  showAlignmentGuides: boolean
  toggleAlignmentGuides: () => void

  // Feature 314: Show smart spacing guides
  showSmartSpacing: boolean
  toggleSmartSpacing: () => void

  // Feature 315: High contrast mode for accessibility
  highContrastMode: boolean
  toggleHighContrastMode: () => void

  // Feature 316: Reduced motion preference
  reducedMotion: boolean
  toggleReducedMotion: () => void

  // Feature 317: Screen reader announcements
  screenReaderAnnouncement: string
  setScreenReaderAnnouncement: (text: string) => void

  // Feature 318: Render quality setting
  renderQuality: 'low' | 'medium' | 'high'
  setRenderQuality: (quality: 'low' | 'medium' | 'high') => void

  // Feature 319: Anti-aliasing toggle
  antiAliasing: boolean
  toggleAntiAliasing: () => void

  // Feature 320: Show FPS counter
  showFPSCounter: boolean
  toggleFPSCounter: () => void

  // Feature 321: Current FPS value
  currentFPS: number
  setCurrentFPS: (fps: number) => void

  // Feature 322: Canvas memory usage estimate
  memoryUsage: number
  setMemoryUsage: (bytes: number) => void

  // Feature 323: Object count in canvas
  objectCount: number
  setObjectCount: (count: number) => void

  // Feature 324: Show color picker panel
  showColorPicker: boolean
  setShowColorPicker: (show: boolean) => void

  // Feature 325: Color picker mode
  colorPickerMode: 'fill' | 'stroke' | 'background'
  setColorPickerMode: (mode: 'fill' | 'stroke' | 'background') => void

  // Feature 326: Favorite colors
  favoriteColors: string[]
  addFavoriteColor: (color: string) => void
  removeFavoriteColor: (color: string) => void

  // Feature 327: Show gradient editor
  showGradientEditor: boolean
  setShowGradientEditor: (show: boolean) => void

  // Feature 328: Current gradient stops
  gradientStops: Array<{ offset: number; color: string }>
  setGradientStops: (stops: Array<{ offset: number; color: string }>) => void

  // Feature 329: Gradient angle/direction
  gradientAngle: number
  setGradientAngle: (angle: number) => void

  // Feature 330: Show transform panel
  showTransformPanel: boolean
  toggleTransformPanel: () => void

  // Feature 331: Constrain proportions lock
  constrainProportions: boolean
  toggleConstrainProportions: () => void

  // Feature 332: Show layers panel filter
  layerFilterType: 'all' | 'visible' | 'hidden' | 'locked'
  setLayerFilterType: (filter: 'all' | 'visible' | 'hidden' | 'locked') => void

  // Feature 333: Collapsed layer groups
  collapsedGroups: string[]
  toggleGroupCollapse: (groupId: string) => void

  // Feature 334: Layer sort order
  layerSortOrder: 'default' | 'name' | 'type' | 'zIndex'
  setLayerSortOrder: (order: 'default' | 'name' | 'type' | 'zIndex') => void

  // Feature 335: Show page thumbnails
  showPageThumbnails: boolean
  togglePageThumbnails: () => void

  // Feature 336: Page layout mode
  pageViewMode: 'single' | 'grid' | 'flow'
  setPageViewMode: (mode: 'single' | 'grid' | 'flow') => void

  // Feature 337: Auto-save interval in seconds
  autoSaveInterval: number
  setAutoSaveInterval: (seconds: number) => void

  // Feature 338: Last saved timestamp
  lastSavedAt: number | null
  setLastSavedAt: (timestamp: number | null) => void

  // Feature 339: Unsaved changes flag
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (has: boolean) => void

  // Feature 340: Show version history panel
  showVersionHistory: boolean
  toggleVersionHistory: () => void

  // Feature 341: Version history entries
  versionHistory: Array<{ id: string; name: string; timestamp: number }>
  addVersion: (version: { id: string; name: string; timestamp: number }) => void

  // Feature 342: Max history size
  maxHistorySize: number
  setMaxHistorySize: (size: number) => void

  // Feature 343: Show asset library panel
  showAssetLibrary: boolean
  toggleAssetLibrary: () => void

  // Feature 344: Asset library search query
  assetSearchQuery: string
  setAssetSearchQuery: (query: string) => void

  // Feature 345: Asset library category filter
  assetCategory: 'all' | 'shapes' | 'icons' | 'images' | 'components'
  setAssetCategory: (category: 'all' | 'shapes' | 'icons' | 'images' | 'components') => void

  // Feature 346: Saved/bookmarked assets
  savedAssets: string[]
  addSavedAsset: (assetId: string) => void
  removeSavedAsset: (assetId: string) => void

  // Feature 347: Show collaboration panel
  showCollaborationPanel: boolean
  toggleCollaborationPanel: () => void

  // Feature 348: Connected collaborators list
  collaborators: Array<{ id: string; name: string; color: string; cursor?: { x: number; y: number } }>
  setCollaborators: (collaborators: Array<{ id: string; name: string; color: string; cursor?: { x: number; y: number } }>) => void

  // Feature 349: Follow mode (follow another user's viewport)
  followingUserId: string | null
  setFollowingUserId: (userId: string | null) => void

  // Feature 350: Show comments panel
  showCommentsPanel: boolean
  toggleCommentsPanel: () => void

  // Feature 351: Comment thread entries
  commentThreads: Array<{ id: string; text: string; author: string; x: number; y: number; resolved: boolean; timestamp: number }>
  addCommentThread: (comment: { id: string; text: string; author: string; x: number; y: number; resolved: boolean; timestamp: number }) => void
  resolveComment: (id: string) => void

  // Feature 352: Show notifications center
  showNotifications: boolean
  toggleNotifications: () => void

  // Feature 353: Notification items
  notifications: Array<{ id: string; message: string; type: string; read: boolean; timestamp: number }>
  addNotification: (notification: { id: string; message: string; type: string; read: boolean; timestamp: number }) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // Feature 354: Show onboarding tour
  showOnboarding: boolean
  setShowOnboarding: (show: boolean) => void

  // Feature 355: Onboarding step
  onboardingStep: number
  setOnboardingStep: (step: number) => void

  // Feature 356: Show help panel
  showHelpPanel: boolean
  toggleHelpPanel: () => void

  // Feature 357: Theme selection
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Feature 358: Accent color for UI
  accentColor: string
  setAccentColor: (color: string) => void

  // Feature 359: UI scale/density
  uiDensity: 'compact' | 'normal' | 'comfortable'
  setUiDensity: (density: 'compact' | 'normal' | 'comfortable') => void

  // Feature 360: Show property inspector
  showPropertyInspector: boolean
  togglePropertyInspector: () => void

  // Feature 361: Pinned properties
  pinnedProperties: string[]
  togglePinnedProperty: (prop: string) => void

  // Feature 362: Show context menu
  contextMenuPosition: { x: number; y: number } | null
  setContextMenuPosition: (pos: { x: number; y: number } | null) => void

  // Feature 363: Context menu items
  contextMenuTarget: string | null
  setContextMenuTarget: (targetId: string | null) => void

  // Feature 364: Show text editing toolbar
  showTextToolbar: boolean
  setShowTextToolbar: (show: boolean) => void

  // Feature 365: Available fonts list
  availableFonts: string[]
  setAvailableFonts: (fonts: string[]) => void

  // Feature 366: Recently used fonts
  recentFonts: string[]
  addRecentFont: (font: string) => void

  // Feature 367: Show effects panel
  showEffectsPanel: boolean
  toggleEffectsPanel: () => void

  // Feature 368: Active effects on selected object
  activeEffects: string[]
  setActiveEffects: (effects: string[]) => void

  // Feature 369: Show blend mode selector
  showBlendModeSelector: boolean
  setShowBlendModeSelector: (show: boolean) => void

  // Feature 370: Canvas rotation angle
  canvasRotation: number
  setCanvasRotation: (angle: number) => void

  // Feature 371: Flip canvas horizontally
  canvasFlippedH: boolean
  toggleCanvasFlipH: () => void

  // Feature 372: Show prototype/interaction panel
  showPrototypePanel: boolean
  togglePrototypePanel: () => void

  // Feature 373: Prototype links
  prototypeLinks: Array<{ from: string; to: string; trigger: string; animation: string }>
  addPrototypeLink: (link: { from: string; to: string; trigger: string; animation: string }) => void
  removePrototypeLink: (fromId: string) => void

  // Feature 374: Show design tokens panel
  showDesignTokens: boolean
  toggleDesignTokens: () => void

  // Feature 375: Design tokens/variables
  designTokens: Record<string, string>
  setDesignToken: (key: string, value: string) => void
  removeDesignToken: (key: string) => void

  // Feature 376: Show inspect/dev panel
  showInspectPanel: boolean
  toggleInspectPanel: () => void

  // Feature 377: Inspect mode code format
  inspectCodeFormat: 'css' | 'tailwind' | 'react' | 'swift'
  setInspectCodeFormat: (format: 'css' | 'tailwind' | 'react' | 'swift') => void

  // Feature 378: Show responsive breakpoints
  showBreakpoints: boolean
  toggleBreakpoints: () => void

  // Feature 379: Responsive breakpoint values
  breakpoints: Array<{ name: string; width: number }>
  setBreakpoints: (breakpoints: Array<{ name: string; width: number }>) => void

  // Feature 380: Active breakpoint
  activeBreakpoint: string
  setActiveBreakpoint: (name: string) => void

  // Feature 381: Show layout grid overlay
  showLayoutGrid: boolean
  toggleLayoutGrid: () => void

  // Feature 382: Layout grid columns
  layoutGridColumns: number
  setLayoutGridColumns: (cols: number) => void

  // Feature 383: Layout grid gutter
  layoutGridGutter: number
  setLayoutGridGutter: (gutter: number) => void

  // Feature 384: Layout grid margin
  layoutGridMargin: number
  setLayoutGridMargin: (margin: number) => void

  // Feature 385: Show baseline grid
  showBaselineGrid: boolean
  toggleBaselineGrid: () => void

  // Feature 386: Baseline grid size
  baselineGridSize: number
  setBaselineGridSize: (size: number) => void

  // Feature 387: Document title
  documentTitle: string
  setDocumentTitle: (title: string) => void

  // Feature 388: Document description
  documentDescription: string
  setDocumentDescription: (desc: string) => void

  // Feature 389: Document tags
  documentTags: string[]
  addDocumentTag: (tag: string) => void
  removeDocumentTag: (tag: string) => void

  // Feature 390: Export history
  exportHistory: Array<{ format: string; timestamp: number; filename: string }>
  addExportHistory: (entry: { format: string; timestamp: number; filename: string }) => void

  // Feature 391: Show batch export dialog
  showBatchExport: boolean
  setShowBatchExport: (show: boolean) => void

  // Feature 392: Batch export items
  batchExportItems: Array<{ id: string; name: string; format: string; scale: number }>
  setBatchExportItems: (items: Array<{ id: string; name: string; format: string; scale: number }>) => void

  // Feature 393: Plugin list
  plugins: Array<{ id: string; name: string; enabled: boolean }>
  setPlugins: (plugins: Array<{ id: string; name: string; enabled: boolean }>) => void
  togglePlugin: (id: string) => void

  // Feature 394: Show plugin manager
  showPluginManager: boolean
  togglePluginManager: () => void

  // Feature 395: Custom keyboard shortcuts mapping
  customShortcuts: Record<string, string>
  setCustomShortcut: (action: string, shortcut: string) => void

  // Feature 396: Show canvas info bar (bottom info)
  showCanvasInfo: boolean
  toggleCanvasInfo: () => void

  // Feature 397: Selected object count
  selectedObjectCount: number
  setSelectedObjectCount: (count: number) => void

  // Feature 398: Clipboard format
  clipboardFormat: 'internal' | 'svg' | 'png'
  setClipboardFormat: (format: 'internal' | 'svg' | 'png') => void

  // Feature 399: Paste in place toggle
  pasteInPlace: boolean
  togglePasteInPlace: () => void

  // Feature 400: Show performance monitor
  showPerformanceMonitor: boolean
  togglePerformanceMonitor: () => void
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

  // ===== Features 301-400: Additional Store Implementations =====

  // Feature 301
  showCommandPalette: false,
  setShowCommandPalette: (show) => set({ showCommandPalette: show }),

  // Feature 302
  showFindReplace: false,
  setShowFindReplace: (show) => set({ showFindReplace: show }),

  // Feature 303
  findQuery: '',
  setFindQuery: (query) => set({ findQuery: query }),

  // Feature 304
  replaceQuery: '',
  setReplaceQuery: (query) => set({ replaceQuery: query }),

  // Feature 305
  defaultFillColor: '#4A90D9',
  setDefaultFillColor: (color) => set({ defaultFillColor: color }),

  // Feature 306
  defaultStrokeColor: '#000000',
  setDefaultStrokeColor: (color) => set({ defaultStrokeColor: color }),

  // Feature 307
  defaultStrokeWidth: 0,
  setDefaultStrokeWidth: (width) => set({ defaultStrokeWidth: width }),

  // Feature 308
  defaultFontFamily: 'Inter',
  setDefaultFontFamily: (font) => set({ defaultFontFamily: font }),

  // Feature 309
  defaultFontSize: 16,
  setDefaultFontSize: (size) => set({ defaultFontSize: size }),

  // Feature 310
  rulerUnits: 'px',
  setRulerUnits: (units) => set({ rulerUnits: units }),

  // Feature 311
  snapTolerance: 5,
  setSnapTolerance: (tolerance) => set({ snapTolerance: tolerance }),

  // Feature 312
  guideColor: '#FF00FF',
  setGuideColor: (color) => set({ guideColor: color }),

  // Feature 313
  showAlignmentGuides: true,
  toggleAlignmentGuides: () => set((s) => ({ showAlignmentGuides: !s.showAlignmentGuides })),

  // Feature 314
  showSmartSpacing: true,
  toggleSmartSpacing: () => set((s) => ({ showSmartSpacing: !s.showSmartSpacing })),

  // Feature 315
  highContrastMode: false,
  toggleHighContrastMode: () => set((s) => ({ highContrastMode: !s.highContrastMode })),

  // Feature 316
  reducedMotion: false,
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),

  // Feature 317
  screenReaderAnnouncement: '',
  setScreenReaderAnnouncement: (text) => set({ screenReaderAnnouncement: text }),

  // Feature 318
  renderQuality: 'high',
  setRenderQuality: (quality) => set({ renderQuality: quality }),

  // Feature 319
  antiAliasing: true,
  toggleAntiAliasing: () => set((s) => ({ antiAliasing: !s.antiAliasing })),

  // Feature 320
  showFPSCounter: false,
  toggleFPSCounter: () => set((s) => ({ showFPSCounter: !s.showFPSCounter })),

  // Feature 321
  currentFPS: 60,
  setCurrentFPS: (fps) => set({ currentFPS: fps }),

  // Feature 322
  memoryUsage: 0,
  setMemoryUsage: (bytes) => set({ memoryUsage: bytes }),

  // Feature 323
  objectCount: 0,
  setObjectCount: (count) => set({ objectCount: count }),

  // Feature 324
  showColorPicker: false,
  setShowColorPicker: (show) => set({ showColorPicker: show }),

  // Feature 325
  colorPickerMode: 'fill',
  setColorPickerMode: (mode) => set({ colorPickerMode: mode }),

  // Feature 326
  favoriteColors: [],
  addFavoriteColor: (color) => set((s) => ({
    favoriteColors: s.favoriteColors.includes(color) ? s.favoriteColors : [...s.favoriteColors, color],
  })),
  removeFavoriteColor: (color) => set((s) => ({
    favoriteColors: s.favoriteColors.filter(c => c !== color),
  })),

  // Feature 327
  showGradientEditor: false,
  setShowGradientEditor: (show) => set({ showGradientEditor: show }),

  // Feature 328
  gradientStops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#FFFFFF' }],
  setGradientStops: (stops) => set({ gradientStops: stops }),

  // Feature 329
  gradientAngle: 0,
  setGradientAngle: (angle) => set({ gradientAngle: angle }),

  // Feature 330
  showTransformPanel: false,
  toggleTransformPanel: () => set((s) => ({ showTransformPanel: !s.showTransformPanel })),

  // Feature 331
  constrainProportions: false,
  toggleConstrainProportions: () => set((s) => ({ constrainProportions: !s.constrainProportions })),

  // Feature 332
  layerFilterType: 'all',
  setLayerFilterType: (filter) => set({ layerFilterType: filter }),

  // Feature 333
  collapsedGroups: [],
  toggleGroupCollapse: (groupId) => set((s) => ({
    collapsedGroups: s.collapsedGroups.includes(groupId)
      ? s.collapsedGroups.filter(id => id !== groupId)
      : [...s.collapsedGroups, groupId],
  })),

  // Feature 334
  layerSortOrder: 'default',
  setLayerSortOrder: (order) => set({ layerSortOrder: order }),

  // Feature 335
  showPageThumbnails: true,
  togglePageThumbnails: () => set((s) => ({ showPageThumbnails: !s.showPageThumbnails })),

  // Feature 336
  pageViewMode: 'single',
  setPageViewMode: (mode) => set({ pageViewMode: mode }),

  // Feature 337
  autoSaveInterval: 30,
  setAutoSaveInterval: (seconds) => set({ autoSaveInterval: seconds }),

  // Feature 338
  lastSavedAt: null,
  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),

  // Feature 339
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (has) => set({ hasUnsavedChanges: has }),

  // Feature 340
  showVersionHistory: false,
  toggleVersionHistory: () => set((s) => ({ showVersionHistory: !s.showVersionHistory })),

  // Feature 341
  versionHistory: [],
  addVersion: (version) => set((s) => ({ versionHistory: [...s.versionHistory, version] })),

  // Feature 342
  maxHistorySize: 100,
  setMaxHistorySize: (size) => set({ maxHistorySize: size }),

  // Feature 343
  showAssetLibrary: false,
  toggleAssetLibrary: () => set((s) => ({ showAssetLibrary: !s.showAssetLibrary })),

  // Feature 344
  assetSearchQuery: '',
  setAssetSearchQuery: (query) => set({ assetSearchQuery: query }),

  // Feature 345
  assetCategory: 'all',
  setAssetCategory: (category) => set({ assetCategory: category }),

  // Feature 346
  savedAssets: [],
  addSavedAsset: (assetId) => set((s) => ({ savedAssets: [...s.savedAssets, assetId] })),
  removeSavedAsset: (assetId) => set((s) => ({ savedAssets: s.savedAssets.filter(a => a !== assetId) })),

  // Feature 347
  showCollaborationPanel: false,
  toggleCollaborationPanel: () => set((s) => ({ showCollaborationPanel: !s.showCollaborationPanel })),

  // Feature 348
  collaborators: [],
  setCollaborators: (collaborators) => set({ collaborators }),

  // Feature 349
  followingUserId: null,
  setFollowingUserId: (userId) => set({ followingUserId: userId }),

  // Feature 350
  showCommentsPanel: false,
  toggleCommentsPanel: () => set((s) => ({ showCommentsPanel: !s.showCommentsPanel })),

  // Feature 351
  commentThreads: [],
  addCommentThread: (comment) => set((s) => ({ commentThreads: [...s.commentThreads, comment] })),
  resolveComment: (id) => set((s) => ({
    commentThreads: s.commentThreads.map(c => c.id === id ? { ...c, resolved: true } : c),
  })),

  // Feature 352
  showNotifications: false,
  toggleNotifications: () => set((s) => ({ showNotifications: !s.showNotifications })),

  // Feature 353
  notifications: [],
  addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications].slice(0, 50) })),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),
  clearNotifications: () => set({ notifications: [] }),

  // Feature 354
  showOnboarding: false,
  setShowOnboarding: (show) => set({ showOnboarding: show }),

  // Feature 355
  onboardingStep: 0,
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  // Feature 356
  showHelpPanel: false,
  toggleHelpPanel: () => set((s) => ({ showHelpPanel: !s.showHelpPanel })),

  // Feature 357
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  // Feature 358
  accentColor: '#007AFF',
  setAccentColor: (color) => set({ accentColor: color }),

  // Feature 359
  uiDensity: 'normal',
  setUiDensity: (density) => set({ uiDensity: density }),

  // Feature 360
  showPropertyInspector: true,
  togglePropertyInspector: () => set((s) => ({ showPropertyInspector: !s.showPropertyInspector })),

  // Feature 361
  pinnedProperties: [],
  togglePinnedProperty: (prop) => set((s) => ({
    pinnedProperties: s.pinnedProperties.includes(prop)
      ? s.pinnedProperties.filter(p => p !== prop)
      : [...s.pinnedProperties, prop],
  })),

  // Feature 362
  contextMenuPosition: null,
  setContextMenuPosition: (pos) => set({ contextMenuPosition: pos }),

  // Feature 363
  contextMenuTarget: null,
  setContextMenuTarget: (targetId) => set({ contextMenuTarget: targetId }),

  // Feature 364
  showTextToolbar: false,
  setShowTextToolbar: (show) => set({ showTextToolbar: show }),

  // Feature 365
  availableFonts: ['Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'],
  setAvailableFonts: (fonts) => set({ availableFonts: fonts }),

  // Feature 366
  recentFonts: [],
  addRecentFont: (font) => set((s) => {
    const filtered = s.recentFonts.filter(f => f !== font)
    return { recentFonts: [font, ...filtered].slice(0, 10) }
  }),

  // Feature 367
  showEffectsPanel: false,
  toggleEffectsPanel: () => set((s) => ({ showEffectsPanel: !s.showEffectsPanel })),

  // Feature 368
  activeEffects: [],
  setActiveEffects: (effects) => set({ activeEffects: effects }),

  // Feature 369
  showBlendModeSelector: false,
  setShowBlendModeSelector: (show) => set({ showBlendModeSelector: show }),

  // Feature 370
  canvasRotation: 0,
  setCanvasRotation: (angle) => set({ canvasRotation: angle }),

  // Feature 371
  canvasFlippedH: false,
  toggleCanvasFlipH: () => set((s) => ({ canvasFlippedH: !s.canvasFlippedH })),

  // Feature 372
  showPrototypePanel: false,
  togglePrototypePanel: () => set((s) => ({ showPrototypePanel: !s.showPrototypePanel })),

  // Feature 373
  prototypeLinks: [],
  addPrototypeLink: (link) => set((s) => ({ prototypeLinks: [...s.prototypeLinks, link] })),
  removePrototypeLink: (fromId) => set((s) => ({ prototypeLinks: s.prototypeLinks.filter(l => l.from !== fromId) })),

  // Feature 374
  showDesignTokens: false,
  toggleDesignTokens: () => set((s) => ({ showDesignTokens: !s.showDesignTokens })),

  // Feature 375
  designTokens: {},
  setDesignToken: (key, value) => set((s) => ({ designTokens: { ...s.designTokens, [key]: value } })),
  removeDesignToken: (key) => set((s) => {
    const tokens = { ...s.designTokens }
    delete tokens[key]
    return { designTokens: tokens }
  }),

  // Feature 376
  showInspectPanel: false,
  toggleInspectPanel: () => set((s) => ({ showInspectPanel: !s.showInspectPanel })),

  // Feature 377
  inspectCodeFormat: 'css',
  setInspectCodeFormat: (format) => set({ inspectCodeFormat: format }),

  // Feature 378
  showBreakpoints: false,
  toggleBreakpoints: () => set((s) => ({ showBreakpoints: !s.showBreakpoints })),

  // Feature 379
  breakpoints: [
    { name: 'Mobile', width: 375 },
    { name: 'Tablet', width: 768 },
    { name: 'Desktop', width: 1280 },
    { name: 'Wide', width: 1920 },
  ],
  setBreakpoints: (breakpoints) => set({ breakpoints }),

  // Feature 380
  activeBreakpoint: 'Desktop',
  setActiveBreakpoint: (name) => set({ activeBreakpoint: name }),

  // Feature 381
  showLayoutGrid: false,
  toggleLayoutGrid: () => set((s) => ({ showLayoutGrid: !s.showLayoutGrid })),

  // Feature 382
  layoutGridColumns: 12,
  setLayoutGridColumns: (cols) => set({ layoutGridColumns: cols }),

  // Feature 383
  layoutGridGutter: 20,
  setLayoutGridGutter: (gutter) => set({ layoutGridGutter: gutter }),

  // Feature 384
  layoutGridMargin: 40,
  setLayoutGridMargin: (margin) => set({ layoutGridMargin: margin }),

  // Feature 385
  showBaselineGrid: false,
  toggleBaselineGrid: () => set((s) => ({ showBaselineGrid: !s.showBaselineGrid })),

  // Feature 386
  baselineGridSize: 8,
  setBaselineGridSize: (size) => set({ baselineGridSize: size }),

  // Feature 387
  documentTitle: 'Untitled Design',
  setDocumentTitle: (title) => set({ documentTitle: title }),

  // Feature 388
  documentDescription: '',
  setDocumentDescription: (desc) => set({ documentDescription: desc }),

  // Feature 389
  documentTags: [],
  addDocumentTag: (tag) => set((s) => ({
    documentTags: s.documentTags.includes(tag) ? s.documentTags : [...s.documentTags, tag],
  })),
  removeDocumentTag: (tag) => set((s) => ({
    documentTags: s.documentTags.filter(t => t !== tag),
  })),

  // Feature 390
  exportHistory: [],
  addExportHistory: (entry) => set((s) => ({ exportHistory: [entry, ...s.exportHistory].slice(0, 20) })),

  // Feature 391
  showBatchExport: false,
  setShowBatchExport: (show) => set({ showBatchExport: show }),

  // Feature 392
  batchExportItems: [],
  setBatchExportItems: (items) => set({ batchExportItems: items }),

  // Feature 393
  plugins: [],
  setPlugins: (plugins) => set({ plugins }),
  togglePlugin: (id) => set((s) => ({
    plugins: s.plugins.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
  })),

  // Feature 394
  showPluginManager: false,
  togglePluginManager: () => set((s) => ({ showPluginManager: !s.showPluginManager })),

  // Feature 395
  customShortcuts: {},
  setCustomShortcut: (action, shortcut) => set((s) => ({
    customShortcuts: { ...s.customShortcuts, [action]: shortcut },
  })),

  // Feature 396
  showCanvasInfo: true,
  toggleCanvasInfo: () => set((s) => ({ showCanvasInfo: !s.showCanvasInfo })),

  // Feature 397
  selectedObjectCount: 0,
  setSelectedObjectCount: (count) => set({ selectedObjectCount: count }),

  // Feature 398
  clipboardFormat: 'internal',
  setClipboardFormat: (format) => set({ clipboardFormat: format }),

  // Feature 399
  pasteInPlace: false,
  togglePasteInPlace: () => set((s) => ({ pasteInPlace: !s.pasteInPlace })),

  // Feature 400
  showPerformanceMonitor: false,
  togglePerformanceMonitor: () => set((s) => ({ showPerformanceMonitor: !s.showPerformanceMonitor })),
}))
