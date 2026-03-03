/**
 * Vigma Design Store Tests
 * Tests for the Zustand store that manages all application state
 */
import { useDesignStore } from '@/store/useDesignStore'

// Helper to reset store between tests
const resetStore = () => {
  useDesignStore.setState({
    activeTool: 'select',
    previousTool: 'select',
    canvasReady: false,
    viewport: { zoom: 1, panX: 0, panY: 0 },
    showGrid: false,
    snapToGrid: false,
    gridSize: 10,
    showRulers: true,
    showGuides: true,
    guides: [],
    selectedIds: [],
    fill: { type: 'solid', color: '#4A90D9', opacity: 1 },
    stroke: { color: '#000000', width: 0, opacity: 1, dashArray: [], lineCap: 'round', lineJoin: 'round' },
    shadow: { color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 0, offsetY: 4, enabled: false },
    textStyle: { fontFamily: 'Inter', fontSize: 20, fontWeight: 'normal', fontStyle: 'normal', underline: false, linethrough: false, overline: false, textAlign: 'left', lineHeight: 1.2, charSpacing: 0, fill: '#1d1d1f' },
    brushSettings: { type: 'pencil', width: 3, color: '#1d1d1f', opacity: 1, shadowBlur: 0, shadowColor: 'rgba(0,0,0,0)' },
    layers: [],
    pages: [{ id: 'page-1', name: 'Page 1', canvasJSON: '' }],
    currentPageId: 'page-1',
    history: [],
    historyIndex: -1,
    clipboard: null,
    leftPanelOpen: true,
    rightPanelOpen: true,
    leftPanelTab: 'layers',
    selectedObjectProps: {},
    zoomToFit: false,
    exportSettings: { format: 'png', scale: 2, quality: 1, background: true, selectedOnly: false },
    showExportDialog: false,
    cornerRadius: 0,
    objectOpacity: 1,
    blendMode: 'normal',
    lastAlignAction: null,
  })
}

describe('Design Store - Tool Management', () => {
  beforeEach(resetStore)

  test('1. Default tool should be select', () => {
    const state = useDesignStore.getState()
    expect(state.activeTool).toBe('select')
  })

  test('2. setActiveTool changes active tool', () => {
    useDesignStore.getState().setActiveTool('rectangle')
    expect(useDesignStore.getState().activeTool).toBe('rectangle')
  })

  test('3. setActiveTool stores previous tool', () => {
    useDesignStore.getState().setActiveTool('rectangle')
    useDesignStore.getState().setActiveTool('ellipse')
    expect(useDesignStore.getState().previousTool).toBe('rectangle')
  })

  test('4. Tool can be set to hand for panning', () => {
    useDesignStore.getState().setActiveTool('hand')
    expect(useDesignStore.getState().activeTool).toBe('hand')
  })

  test('5. Tool can be set to text', () => {
    useDesignStore.getState().setActiveTool('text')
    expect(useDesignStore.getState().activeTool).toBe('text')
  })

  test('6. Tool can be set to pen', () => {
    useDesignStore.getState().setActiveTool('pen')
    expect(useDesignStore.getState().activeTool).toBe('pen')
  })

  test('7. Tool can be set to pencil', () => {
    useDesignStore.getState().setActiveTool('pencil')
    expect(useDesignStore.getState().activeTool).toBe('pencil')
  })

  test('8. Tool can be set to brush', () => {
    useDesignStore.getState().setActiveTool('brush')
    expect(useDesignStore.getState().activeTool).toBe('brush')
  })

  test('9. Tool can be set to eraser', () => {
    useDesignStore.getState().setActiveTool('eraser')
    expect(useDesignStore.getState().activeTool).toBe('eraser')
  })

  test('10. Tool can be set to image', () => {
    useDesignStore.getState().setActiveTool('image')
    expect(useDesignStore.getState().activeTool).toBe('image')
  })

  test('11. Tool can be set to eyedropper', () => {
    useDesignStore.getState().setActiveTool('eyedropper')
    expect(useDesignStore.getState().activeTool).toBe('eyedropper')
  })

  test('12. Tool can be set to frame', () => {
    useDesignStore.getState().setActiveTool('frame')
    expect(useDesignStore.getState().activeTool).toBe('frame')
  })

  test('13. Tool can be set to line', () => {
    useDesignStore.getState().setActiveTool('line')
    expect(useDesignStore.getState().activeTool).toBe('line')
  })

  test('14. Tool can be set to arrow', () => {
    useDesignStore.getState().setActiveTool('arrow')
    expect(useDesignStore.getState().activeTool).toBe('arrow')
  })

  test('15. Tool can be set to polygon', () => {
    useDesignStore.getState().setActiveTool('polygon')
    expect(useDesignStore.getState().activeTool).toBe('polygon')
  })

  test('16. Tool can be set to star', () => {
    useDesignStore.getState().setActiveTool('star')
    expect(useDesignStore.getState().activeTool).toBe('star')
  })

  test('17. Tool can be set to triangle', () => {
    useDesignStore.getState().setActiveTool('triangle')
    expect(useDesignStore.getState().activeTool).toBe('triangle')
  })

  test('18. Rapid tool switching preserves previous correctly', () => {
    const tools = ['rectangle', 'ellipse', 'triangle', 'line', 'text'] as const
    tools.forEach(t => useDesignStore.getState().setActiveTool(t))
    expect(useDesignStore.getState().activeTool).toBe('text')
    expect(useDesignStore.getState().previousTool).toBe('line')
  })
})

describe('Design Store - Canvas State', () => {
  beforeEach(resetStore)

  test('19. Default canvas is not ready', () => {
    expect(useDesignStore.getState().canvasReady).toBe(false)
  })

  test('20. setCanvasReady marks canvas as ready', () => {
    useDesignStore.getState().setCanvasReady(true)
    expect(useDesignStore.getState().canvasReady).toBe(true)
  })

  test('21. Default viewport zoom is 1', () => {
    expect(useDesignStore.getState().viewport.zoom).toBe(1)
  })

  test('22. setViewport updates zoom', () => {
    useDesignStore.getState().setViewport({ zoom: 2 })
    expect(useDesignStore.getState().viewport.zoom).toBe(2)
  })

  test('23. setViewport updates pan', () => {
    useDesignStore.getState().setViewport({ panX: 100, panY: 200 })
    expect(useDesignStore.getState().viewport.panX).toBe(100)
    expect(useDesignStore.getState().viewport.panY).toBe(200)
  })

  test('24. setViewport partial update preserves other values', () => {
    useDesignStore.getState().setViewport({ zoom: 2 })
    useDesignStore.getState().setViewport({ panX: 50 })
    const vp = useDesignStore.getState().viewport
    expect(vp.zoom).toBe(2)
    expect(vp.panX).toBe(50)
  })

  test('25. Grid is off by default', () => {
    expect(useDesignStore.getState().showGrid).toBe(false)
  })

  test('26. toggleGrid turns grid on', () => {
    useDesignStore.getState().toggleGrid()
    expect(useDesignStore.getState().showGrid).toBe(true)
  })

  test('27. toggleGrid twice turns grid off again', () => {
    useDesignStore.getState().toggleGrid()
    useDesignStore.getState().toggleGrid()
    expect(useDesignStore.getState().showGrid).toBe(false)
  })

  test('28. Snap to grid is off by default', () => {
    expect(useDesignStore.getState().snapToGrid).toBe(false)
  })

  test('29. toggleSnapToGrid turns snap on', () => {
    useDesignStore.getState().toggleSnapToGrid()
    expect(useDesignStore.getState().snapToGrid).toBe(true)
  })

  test('30. Default grid size is 10', () => {
    expect(useDesignStore.getState().gridSize).toBe(10)
  })

  test('31. setGridSize updates grid size', () => {
    useDesignStore.getState().setGridSize(20)
    expect(useDesignStore.getState().gridSize).toBe(20)
  })

  test('32. Rulers shown by default', () => {
    expect(useDesignStore.getState().showRulers).toBe(true)
  })

  test('33. toggleRulers hides rulers', () => {
    useDesignStore.getState().toggleRulers()
    expect(useDesignStore.getState().showRulers).toBe(false)
  })

  test('34. Guides shown by default', () => {
    expect(useDesignStore.getState().showGuides).toBe(true)
  })

  test('35. toggleGuides hides guides', () => {
    useDesignStore.getState().toggleGuides()
    expect(useDesignStore.getState().showGuides).toBe(false)
  })

  test('36. addGuide adds a guide', () => {
    useDesignStore.getState().addGuide({ id: 'g1', orientation: 'horizontal', position: 100 })
    expect(useDesignStore.getState().guides).toHaveLength(1)
  })

  test('37. removeGuide removes a guide', () => {
    useDesignStore.getState().addGuide({ id: 'g1', orientation: 'horizontal', position: 100 })
    useDesignStore.getState().removeGuide('g1')
    expect(useDesignStore.getState().guides).toHaveLength(0)
  })
})

describe('Design Store - Selection', () => {
  beforeEach(resetStore)

  test('38. Default selected IDs are empty', () => {
    expect(useDesignStore.getState().selectedIds).toEqual([])
  })

  test('39. setSelectedIds sets single selection', () => {
    useDesignStore.getState().setSelectedIds(['obj-1'])
    expect(useDesignStore.getState().selectedIds).toEqual(['obj-1'])
  })

  test('40. setSelectedIds sets multi-selection', () => {
    useDesignStore.getState().setSelectedIds(['obj-1', 'obj-2', 'obj-3'])
    expect(useDesignStore.getState().selectedIds).toHaveLength(3)
  })

  test('41. setSelectedIds to empty clears selection', () => {
    useDesignStore.getState().setSelectedIds(['obj-1'])
    useDesignStore.getState().setSelectedIds([])
    expect(useDesignStore.getState().selectedIds).toEqual([])
  })
})

describe('Design Store - Fill & Stroke', () => {
  beforeEach(resetStore)

  test('42. Default fill is solid blue', () => {
    const fill = useDesignStore.getState().fill
    expect(fill.type).toBe('solid')
    expect(fill.color).toBe('#4A90D9')
  })

  test('43. setFill updates fill color', () => {
    useDesignStore.getState().setFill({ color: '#FF0000' })
    expect(useDesignStore.getState().fill.color).toBe('#FF0000')
  })

  test('44. setFill updates fill type to gradient', () => {
    useDesignStore.getState().setFill({ type: 'gradient' })
    expect(useDesignStore.getState().fill.type).toBe('gradient')
  })

  test('45. setFill partial update preserves other fill props', () => {
    useDesignStore.getState().setFill({ color: '#00FF00' })
    expect(useDesignStore.getState().fill.type).toBe('solid')
    expect(useDesignStore.getState().fill.opacity).toBe(1)
  })

  test('46. Default stroke width is 0', () => {
    expect(useDesignStore.getState().stroke.width).toBe(0)
  })

  test('47. setStroke updates stroke color', () => {
    useDesignStore.getState().setStroke({ color: '#FF0000' })
    expect(useDesignStore.getState().stroke.color).toBe('#FF0000')
  })

  test('48. setStroke updates stroke width', () => {
    useDesignStore.getState().setStroke({ width: 3 })
    expect(useDesignStore.getState().stroke.width).toBe(3)
  })

  test('49. setStroke updates dash array', () => {
    useDesignStore.getState().setStroke({ dashArray: [5, 5] })
    expect(useDesignStore.getState().stroke.dashArray).toEqual([5, 5])
  })

  test('50. Default shadow is disabled', () => {
    expect(useDesignStore.getState().shadow.enabled).toBe(false)
  })

  test('51. setShadow enables shadow', () => {
    useDesignStore.getState().setShadow({ enabled: true })
    expect(useDesignStore.getState().shadow.enabled).toBe(true)
  })

  test('52. setShadow updates blur', () => {
    useDesignStore.getState().setShadow({ blur: 20 })
    expect(useDesignStore.getState().shadow.blur).toBe(20)
  })

  test('53. setShadow updates offset', () => {
    useDesignStore.getState().setShadow({ offsetX: 5, offsetY: 10 })
    expect(useDesignStore.getState().shadow.offsetX).toBe(5)
    expect(useDesignStore.getState().shadow.offsetY).toBe(10)
  })
})

describe('Design Store - Text Style', () => {
  beforeEach(resetStore)

  test('54. Default font family is Inter', () => {
    expect(useDesignStore.getState().textStyle.fontFamily).toBe('Inter')
  })

  test('55. setTextStyle changes font family', () => {
    useDesignStore.getState().setTextStyle({ fontFamily: 'Arial' })
    expect(useDesignStore.getState().textStyle.fontFamily).toBe('Arial')
  })

  test('56. Default font size is 20', () => {
    expect(useDesignStore.getState().textStyle.fontSize).toBe(20)
  })

  test('57. setTextStyle changes font size', () => {
    useDesignStore.getState().setTextStyle({ fontSize: 48 })
    expect(useDesignStore.getState().textStyle.fontSize).toBe(48)
  })

  test('58. setTextStyle enables bold', () => {
    useDesignStore.getState().setTextStyle({ fontWeight: 'bold' })
    expect(useDesignStore.getState().textStyle.fontWeight).toBe('bold')
  })

  test('59. setTextStyle enables italic', () => {
    useDesignStore.getState().setTextStyle({ fontStyle: 'italic' })
    expect(useDesignStore.getState().textStyle.fontStyle).toBe('italic')
  })

  test('60. setTextStyle enables underline', () => {
    useDesignStore.getState().setTextStyle({ underline: true })
    expect(useDesignStore.getState().textStyle.underline).toBe(true)
  })

  test('61. setTextStyle enables linethrough', () => {
    useDesignStore.getState().setTextStyle({ linethrough: true })
    expect(useDesignStore.getState().textStyle.linethrough).toBe(true)
  })

  test('62. setTextStyle changes alignment to center', () => {
    useDesignStore.getState().setTextStyle({ textAlign: 'center' })
    expect(useDesignStore.getState().textStyle.textAlign).toBe('center')
  })

  test('63. setTextStyle changes line height', () => {
    useDesignStore.getState().setTextStyle({ lineHeight: 1.5 })
    expect(useDesignStore.getState().textStyle.lineHeight).toBe(1.5)
  })

  test('64. setTextStyle changes letter spacing', () => {
    useDesignStore.getState().setTextStyle({ charSpacing: 100 })
    expect(useDesignStore.getState().textStyle.charSpacing).toBe(100)
  })

  test('65. Multiple text style updates compound correctly', () => {
    useDesignStore.getState().setTextStyle({ fontWeight: 'bold', fontStyle: 'italic', underline: true })
    const ts = useDesignStore.getState().textStyle
    expect(ts.fontWeight).toBe('bold')
    expect(ts.fontStyle).toBe('italic')
    expect(ts.underline).toBe(true)
    expect(ts.fontFamily).toBe('Inter') // unchanged
  })
})

describe('Design Store - Brush Settings', () => {
  beforeEach(resetStore)

  test('66. Default brush type is pencil', () => {
    expect(useDesignStore.getState().brushSettings.type).toBe('pencil')
  })

  test('67. Default brush width is 3', () => {
    expect(useDesignStore.getState().brushSettings.width).toBe(3)
  })

  test('68. setBrushSettings changes width', () => {
    useDesignStore.getState().setBrushSettings({ width: 10 })
    expect(useDesignStore.getState().brushSettings.width).toBe(10)
  })

  test('69. setBrushSettings changes color', () => {
    useDesignStore.getState().setBrushSettings({ color: '#FF0000' })
    expect(useDesignStore.getState().brushSettings.color).toBe('#FF0000')
  })

  test('70. setBrushSettings changes opacity', () => {
    useDesignStore.getState().setBrushSettings({ opacity: 0.5 })
    expect(useDesignStore.getState().brushSettings.opacity).toBe(0.5)
  })
})

describe('Design Store - Layers', () => {
  beforeEach(resetStore)

  test('71. Default layers are empty', () => {
    expect(useDesignStore.getState().layers).toEqual([])
  })

  test('72. setLayers sets layer list', () => {
    useDesignStore.getState().setLayers([
      { id: 'l1', name: 'Rect', type: 'rect', visible: true, locked: false },
    ])
    expect(useDesignStore.getState().layers).toHaveLength(1)
  })

  test('73. setLayers replaces existing layers', () => {
    useDesignStore.getState().setLayers([
      { id: 'l1', name: 'Rect', type: 'rect', visible: true, locked: false },
    ])
    useDesignStore.getState().setLayers([
      { id: 'l2', name: 'Circle', type: 'circle', visible: true, locked: false },
      { id: 'l3', name: 'Text', type: 'textbox', visible: true, locked: false },
    ])
    expect(useDesignStore.getState().layers).toHaveLength(2)
    expect(useDesignStore.getState().layers[0].name).toBe('Circle')
  })
})

describe('Design Store - Pages', () => {
  beforeEach(resetStore)

  test('74. Default has one page', () => {
    expect(useDesignStore.getState().pages).toHaveLength(1)
  })

  test('75. Default page is named Page 1', () => {
    expect(useDesignStore.getState().pages[0].name).toBe('Page 1')
  })

  test('76. Default current page is page-1', () => {
    expect(useDesignStore.getState().currentPageId).toBe('page-1')
  })

  test('77. addPage adds a new page', () => {
    useDesignStore.getState().addPage({ id: 'page-2', name: 'Page 2', canvasJSON: '' })
    expect(useDesignStore.getState().pages).toHaveLength(2)
  })

  test('78. setCurrentPageId switches active page', () => {
    useDesignStore.getState().addPage({ id: 'page-2', name: 'Page 2', canvasJSON: '' })
    useDesignStore.getState().setCurrentPageId('page-2')
    expect(useDesignStore.getState().currentPageId).toBe('page-2')
  })

  test('79. removePage removes a page', () => {
    useDesignStore.getState().addPage({ id: 'page-2', name: 'Page 2', canvasJSON: '' })
    useDesignStore.getState().removePage('page-2')
    expect(useDesignStore.getState().pages).toHaveLength(1)
  })

  test('80. updatePage updates page name', () => {
    useDesignStore.getState().updatePage('page-1', { name: 'Home' })
    expect(useDesignStore.getState().pages[0].name).toBe('Home')
  })

  test('81. updatePage stores canvas JSON', () => {
    useDesignStore.getState().updatePage('page-1', { canvasJSON: '{"objects":[]}' })
    expect(useDesignStore.getState().pages[0].canvasJSON).toBe('{"objects":[]}')
  })

  test('82. Multiple pages can be added', () => {
    for (let i = 2; i <= 5; i++) {
      useDesignStore.getState().addPage({ id: `page-${i}`, name: `Page ${i}`, canvasJSON: '' })
    }
    expect(useDesignStore.getState().pages).toHaveLength(5)
  })

  test('83. Removing non-existent page doesnt crash', () => {
    useDesignStore.getState().removePage('nonexistent')
    expect(useDesignStore.getState().pages).toHaveLength(1)
  })
})

describe('Design Store - History', () => {
  beforeEach(resetStore)

  test('84. Default history is empty', () => {
    expect(useDesignStore.getState().history).toEqual([])
    expect(useDesignStore.getState().historyIndex).toBe(-1)
  })

  test('85. addHistory adds entry', () => {
    useDesignStore.getState().addHistory({ canvasJSON: '{}', timestamp: Date.now() })
    expect(useDesignStore.getState().history).toHaveLength(1)
    expect(useDesignStore.getState().historyIndex).toBe(0)
  })

  test('86. Multiple history entries increase index', () => {
    for (let i = 0; i < 5; i++) {
      useDesignStore.getState().addHistory({ canvasJSON: `{${i}}`, timestamp: Date.now() })
    }
    expect(useDesignStore.getState().history).toHaveLength(5)
    expect(useDesignStore.getState().historyIndex).toBe(4)
  })

  test('87. setHistoryIndex changes index', () => {
    for (let i = 0; i < 5; i++) {
      useDesignStore.getState().addHistory({ canvasJSON: `{${i}}`, timestamp: Date.now() })
    }
    useDesignStore.getState().setHistoryIndex(2)
    expect(useDesignStore.getState().historyIndex).toBe(2)
  })

  test('88. clearHistory resets history', () => {
    useDesignStore.getState().addHistory({ canvasJSON: '{}', timestamp: Date.now() })
    useDesignStore.getState().clearHistory()
    expect(useDesignStore.getState().history).toEqual([])
    expect(useDesignStore.getState().historyIndex).toBe(-1)
  })

  test('89. History caps at 100 entries', () => {
    for (let i = 0; i < 110; i++) {
      useDesignStore.getState().addHistory({ canvasJSON: `{${i}}`, timestamp: Date.now() })
    }
    expect(useDesignStore.getState().history.length).toBeLessThanOrEqual(100)
  })

  test('90. Adding history after setHistoryIndex truncates future', () => {
    for (let i = 0; i < 5; i++) {
      useDesignStore.getState().addHistory({ canvasJSON: `{${i}}`, timestamp: Date.now() })
    }
    useDesignStore.getState().setHistoryIndex(2)
    useDesignStore.getState().addHistory({ canvasJSON: '{new}', timestamp: Date.now() })
    expect(useDesignStore.getState().history).toHaveLength(4) // 0,1,2,new
    expect(useDesignStore.getState().historyIndex).toBe(3)
  })
})

describe('Design Store - Clipboard', () => {
  beforeEach(resetStore)

  test('91. Default clipboard is null', () => {
    expect(useDesignStore.getState().clipboard).toBeNull()
  })

  test('92. setClipboard stores data', () => {
    useDesignStore.getState().setClipboard('{"type":"rect"}')
    expect(useDesignStore.getState().clipboard).toBe('{"type":"rect"}')
  })

  test('93. setClipboard to null clears clipboard', () => {
    useDesignStore.getState().setClipboard('data')
    useDesignStore.getState().setClipboard(null)
    expect(useDesignStore.getState().clipboard).toBeNull()
  })
})

describe('Design Store - UI State', () => {
  beforeEach(resetStore)

  test('94. Left panel is open by default', () => {
    expect(useDesignStore.getState().leftPanelOpen).toBe(true)
  })

  test('95. toggleLeftPanel closes left panel', () => {
    useDesignStore.getState().toggleLeftPanel()
    expect(useDesignStore.getState().leftPanelOpen).toBe(false)
  })

  test('96. Right panel is open by default', () => {
    expect(useDesignStore.getState().rightPanelOpen).toBe(true)
  })

  test('97. toggleRightPanel closes right panel', () => {
    useDesignStore.getState().toggleRightPanel()
    expect(useDesignStore.getState().rightPanelOpen).toBe(false)
  })

  test('98. Default left panel tab is layers', () => {
    expect(useDesignStore.getState().leftPanelTab).toBe('layers')
  })

  test('99. setLeftPanelTab switches to pages', () => {
    useDesignStore.getState().setLeftPanelTab('pages')
    expect(useDesignStore.getState().leftPanelTab).toBe('pages')
  })

  test('100. setLeftPanelTab switches to assets', () => {
    useDesignStore.getState().setLeftPanelTab('assets')
    expect(useDesignStore.getState().leftPanelTab).toBe('assets')
  })
})

describe('Design Store - Export Settings', () => {
  beforeEach(resetStore)

  test('101. Default export format is png', () => {
    expect(useDesignStore.getState().exportSettings.format).toBe('png')
  })

  test('102. Default export scale is 2x', () => {
    expect(useDesignStore.getState().exportSettings.scale).toBe(2)
  })

  test('103. setExportSettings changes format', () => {
    useDesignStore.getState().setExportSettings({ format: 'svg' })
    expect(useDesignStore.getState().exportSettings.format).toBe('svg')
  })

  test('104. setExportSettings changes scale', () => {
    useDesignStore.getState().setExportSettings({ scale: 3 })
    expect(useDesignStore.getState().exportSettings.scale).toBe(3)
  })

  test('105. Export dialog is closed by default', () => {
    expect(useDesignStore.getState().showExportDialog).toBe(false)
  })

  test('106. setShowExportDialog opens dialog', () => {
    useDesignStore.getState().setShowExportDialog(true)
    expect(useDesignStore.getState().showExportDialog).toBe(true)
  })
})

describe('Design Store - Object Properties', () => {
  beforeEach(resetStore)

  test('107. Default corner radius is 0', () => {
    expect(useDesignStore.getState().cornerRadius).toBe(0)
  })

  test('108. setCornerRadius updates radius', () => {
    useDesignStore.getState().setCornerRadius(12)
    expect(useDesignStore.getState().cornerRadius).toBe(12)
  })

  test('109. Default object opacity is 1', () => {
    expect(useDesignStore.getState().objectOpacity).toBe(1)
  })

  test('110. setObjectOpacity updates opacity', () => {
    useDesignStore.getState().setObjectOpacity(0.5)
    expect(useDesignStore.getState().objectOpacity).toBe(0.5)
  })

  test('111. Default blend mode is normal', () => {
    expect(useDesignStore.getState().blendMode).toBe('normal')
  })

  test('112. setBlendMode changes mode', () => {
    useDesignStore.getState().setBlendMode('multiply')
    expect(useDesignStore.getState().blendMode).toBe('multiply')
  })

  test('113. setSelectedObjectProps stores properties', () => {
    useDesignStore.getState().setSelectedObjectProps({ left: 100, top: 200 })
    expect(useDesignStore.getState().selectedObjectProps).toEqual({ left: 100, top: 200 })
  })

  test('114. lastAlignAction is null by default', () => {
    expect(useDesignStore.getState().lastAlignAction).toBeNull()
  })

  test('115. setLastAlignAction stores action', () => {
    useDesignStore.getState().setLastAlignAction('left')
    expect(useDesignStore.getState().lastAlignAction).toBe('left')
  })
})

describe('Design Store - Complex Workflows', () => {
  beforeEach(resetStore)

  test('116. Full tool cycle workflow', () => {
    const { setActiveTool } = useDesignStore.getState()
    setActiveTool('rectangle') // create shape
    setActiveTool('select')    // select it
    setActiveTool('hand')      // pan around
    setActiveTool('select')    // back to select
    expect(useDesignStore.getState().activeTool).toBe('select')
    expect(useDesignStore.getState().previousTool).toBe('hand')
  })

  test('117. Multi-page workflow: create pages, switch, store data', () => {
    const store = useDesignStore.getState()
    store.addPage({ id: 'p2', name: 'Page 2', canvasJSON: '' })
    store.addPage({ id: 'p3', name: 'Page 3', canvasJSON: '' })
    store.setCurrentPageId('p2')
    store.updatePage('p2', { canvasJSON: '{"objects":[{"type":"rect"}]}' })
    store.setCurrentPageId('p3')
    expect(useDesignStore.getState().currentPageId).toBe('p3')
    expect(useDesignStore.getState().pages.find(p => p.id === 'p2')?.canvasJSON).toContain('rect')
  })

  test('118. Design property workflow: fill -> stroke -> shadow', () => {
    const store = useDesignStore.getState()
    store.setFill({ color: '#FF6600', type: 'solid' })
    store.setStroke({ color: '#333333', width: 2 })
    store.setShadow({ enabled: true, blur: 15, offsetX: 3, offsetY: 3 })
    const state = useDesignStore.getState()
    expect(state.fill.color).toBe('#FF6600')
    expect(state.stroke.width).toBe(2)
    expect(state.shadow.enabled).toBe(true)
    expect(state.shadow.blur).toBe(15)
  })

  test('119. Text editing workflow: font -> style -> alignment', () => {
    const store = useDesignStore.getState()
    store.setTextStyle({ fontFamily: 'Georgia' })
    store.setTextStyle({ fontSize: 32 })
    store.setTextStyle({ fontWeight: 'bold', fontStyle: 'italic' })
    store.setTextStyle({ textAlign: 'center' })
    store.setTextStyle({ lineHeight: 1.8, charSpacing: 50 })
    const ts = useDesignStore.getState().textStyle
    expect(ts.fontFamily).toBe('Georgia')
    expect(ts.fontSize).toBe(32)
    expect(ts.fontWeight).toBe('bold')
    expect(ts.fontStyle).toBe('italic')
    expect(ts.textAlign).toBe('center')
    expect(ts.lineHeight).toBe(1.8)
    expect(ts.charSpacing).toBe(50)
  })

  test('120. Panel toggle workflow', () => {
    const store = useDesignStore.getState()
    store.toggleLeftPanel()
    store.toggleRightPanel()
    expect(useDesignStore.getState().leftPanelOpen).toBe(false)
    expect(useDesignStore.getState().rightPanelOpen).toBe(false)
    store.toggleLeftPanel()
    store.toggleRightPanel()
    expect(useDesignStore.getState().leftPanelOpen).toBe(true)
    expect(useDesignStore.getState().rightPanelOpen).toBe(true)
  })

  test('121. Viewport zoom and pan workflow', () => {
    const store = useDesignStore.getState()
    store.setViewport({ zoom: 0.5 })
    store.setViewport({ panX: -200, panY: -100 })
    store.setViewport({ zoom: 2 })
    const vp = useDesignStore.getState().viewport
    expect(vp.zoom).toBe(2)
    expect(vp.panX).toBe(-200)
    expect(vp.panY).toBe(-100)
  })

  test('122. History with undo simulation', () => {
    const store = useDesignStore.getState()
    store.addHistory({ canvasJSON: '{"v":"1"}', timestamp: 1 })
    store.addHistory({ canvasJSON: '{"v":"2"}', timestamp: 2 })
    store.addHistory({ canvasJSON: '{"v":"3"}', timestamp: 3 })
    expect(useDesignStore.getState().historyIndex).toBe(2)
    store.setHistoryIndex(1) // simulate undo
    expect(useDesignStore.getState().historyIndex).toBe(1)
    store.setHistoryIndex(2) // simulate redo
    expect(useDesignStore.getState().historyIndex).toBe(2)
  })

  test('123. Brush switching workflow', () => {
    const store = useDesignStore.getState()
    store.setBrushSettings({ type: 'pencil', width: 2, color: '#000' })
    store.setActiveTool('pen')
    store.setBrushSettings({ type: 'circle', width: 15, color: '#FF0000' })
    store.setActiveTool('brush')
    const bs = useDesignStore.getState().brushSettings
    expect(bs.type).toBe('circle')
    expect(bs.width).toBe(15)
    expect(bs.color).toBe('#FF0000')
  })

  test('124. Export settings workflow', () => {
    const store = useDesignStore.getState()
    store.setExportSettings({ format: 'svg', scale: 1 })
    store.setShowExportDialog(true)
    expect(useDesignStore.getState().exportSettings.format).toBe('svg')
    expect(useDesignStore.getState().showExportDialog).toBe(true)
    store.setShowExportDialog(false)
    expect(useDesignStore.getState().showExportDialog).toBe(false)
  })

  test('125. Layer management workflow', () => {
    const store = useDesignStore.getState()
    const mockLayers = [
      { id: '1', name: 'Background', type: 'rect', visible: true, locked: true },
      { id: '2', name: 'Logo', type: 'image', visible: true, locked: false },
      { id: '3', name: 'Title', type: 'textbox', visible: true, locked: false },
      { id: '4', name: 'Subtitle', type: 'textbox', visible: false, locked: false },
    ]
    store.setLayers(mockLayers)
    expect(useDesignStore.getState().layers).toHaveLength(4)
    expect(useDesignStore.getState().layers[3].visible).toBe(false)
    expect(useDesignStore.getState().layers[0].locked).toBe(true)
  })
})

describe('Design Store - Edge Cases', () => {
  beforeEach(resetStore)

  test('126. Setting fill opacity to 0 works', () => {
    useDesignStore.getState().setFill({ opacity: 0 })
    expect(useDesignStore.getState().fill.opacity).toBe(0)
  })

  test('127. Setting stroke width to very large value works', () => {
    useDesignStore.getState().setStroke({ width: 100 })
    expect(useDesignStore.getState().stroke.width).toBe(100)
  })

  test('128. Setting negative shadow offset works', () => {
    useDesignStore.getState().setShadow({ offsetX: -10, offsetY: -10 })
    expect(useDesignStore.getState().shadow.offsetX).toBe(-10)
  })

  test('129. Setting corner radius to 0 works', () => {
    useDesignStore.getState().setCornerRadius(0)
    expect(useDesignStore.getState().cornerRadius).toBe(0)
  })

  test('130. Setting object opacity to 0 works', () => {
    useDesignStore.getState().setObjectOpacity(0)
    expect(useDesignStore.getState().objectOpacity).toBe(0)
  })

  test('131. Very small zoom value works', () => {
    useDesignStore.getState().setViewport({ zoom: 0.01 })
    expect(useDesignStore.getState().viewport.zoom).toBe(0.01)
  })

  test('132. Very large zoom value works', () => {
    useDesignStore.getState().setViewport({ zoom: 20 })
    expect(useDesignStore.getState().viewport.zoom).toBe(20)
  })

  test('133. Empty string for clipboard is truthy', () => {
    useDesignStore.getState().setClipboard('')
    expect(useDesignStore.getState().clipboard).toBe('')
  })

  test('134. Setting font size to 1 works', () => {
    useDesignStore.getState().setTextStyle({ fontSize: 1 })
    expect(useDesignStore.getState().textStyle.fontSize).toBe(1)
  })

  test('135. Setting font size to very large works', () => {
    useDesignStore.getState().setTextStyle({ fontSize: 999 })
    expect(useDesignStore.getState().textStyle.fontSize).toBe(999)
  })
})
