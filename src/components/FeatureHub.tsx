'use client'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useDesignStore } from '@/store/useDesignStore'
import type { CanvasEngine } from '@/lib/canvasEngine'
import { FONT_LIST } from '@/types/design'

import CommandPalette from '@/components/CommandPalette'
import FindReplaceDialog from '@/components/FindReplaceDialog'
import ColorPickerPanel from '@/components/ColorPickerPanel'
import GradientEditor from '@/components/GradientEditor'
import TransformPanel from '@/components/TransformPanel'
import LayerFilterBar from '@/components/LayerFilterBar'
import VersionHistoryPanel from '@/components/VersionHistoryPanel'
import AssetLibraryPanel from '@/components/AssetLibraryPanel'
import CollaborationPanel from '@/components/CollaborationPanel'
import NotificationsPanel from '@/components/NotificationsPanel'
import OnboardingTour from '@/components/OnboardingTour'
import HelpPanel from '@/components/HelpPanel'
import ThemeSelector from '@/components/ThemeSelector'
import UIDensitySelector from '@/components/UIDensitySelector'
import TextToolbar from '@/components/TextToolbar'
import EffectsPanel from '@/components/EffectsPanel'
import BlendModeSelector from '@/components/BlendModeSelector'
import PrototypeLinkPanel from '@/components/PrototypeLinkPanel'
import DesignTokensPanel from '@/components/DesignTokensPanel'
import InspectCodePanel from '@/components/InspectCodePanel'
import BreakpointBar from '@/components/BreakpointBar'
import LayoutGridOverlay from '@/components/LayoutGridOverlay'
import BaselineGridOverlay from '@/components/BaselineGridOverlay'
import DocumentSettingsPanel from '@/components/DocumentSettingsPanel'
import BatchExportDialog from '@/components/BatchExportDialog'
import PluginManagerPanel from '@/components/PluginManagerPanel'
import ShortcutCustomizer from '@/components/ShortcutCustomizer'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import SnapSettingsPanel from '@/components/SnapSettingsPanel'
import AccessibilityPanel from '@/components/AccessibilityPanel'
import ExportHistoryPanel from '@/components/ExportHistoryPanel'
import DefaultStylesPanel from '@/components/DefaultStylesPanel'
import ColorContrastChecker from '@/components/ColorContrastChecker'
import ObjectAlignmentBar from '@/components/ObjectAlignmentBar'
import ToolOptionsBar from '@/components/ToolOptionsBar'
import RecentFontsList from '@/components/RecentFontsList'
import MultiSelectActions from '@/components/MultiSelectActions'
import QuickActionButton from '@/components/QuickActionButton'
import AutoSaveIndicator from '@/components/AutoSaveIndicator'
import CanvasInfoBar from '@/components/CanvasInfoBar'
import ShapePresetsPanel from '@/components/ShapePresetsPanel'
import ImageFiltersPanel from '@/components/ImageFiltersPanel'
import BooleanOperationsBar from '@/components/BooleanOperationsBar'
import TextSpacingControls from '@/components/TextSpacingControls'
import ArrangeControls from '@/components/ArrangeControls'
import GroupControls from '@/components/GroupControls'
import FlipControls from '@/components/FlipControls'
import DuplicateControls from '@/components/DuplicateControls'
import ComponentLibrary from '@/components/ComponentLibrary'
import StylePresetsPanel from '@/components/StylePresetsPanel'
import DevicePreview from '@/components/DevicePreview'
import AutoLayoutSettings from '@/components/AutoLayoutSettings'
import AnimationPanel from '@/components/AnimationPanel'
import HandoffSpecsPanel from '@/components/HandoffSpecsPanel'
import DesignLintPanel from '@/components/DesignLintPanel'
import ExportPreviewPanel from '@/components/ExportPreviewPanel'
import AnnotationToolbar from '@/components/AnnotationToolbar'
import ConfirmDialog from '@/components/ConfirmDialog'
import FloatingActionButton from '@/components/FloatingActionButton'
import PageThumbnails from '@/components/PageThumbnails'

interface FeatureHubProps {
  engineRef: React.RefObject<CanvasEngine | null>
  refreshLayers: () => void
  refreshObjectProps: () => void
  syncActiveToCollab: () => void
  selectedIds: string[]
  objectProps: Record<string, any> | null
  zoom: number
  activeTool: string
  pages: Array<{ id: string; name: string }>
  currentPageId: string
}

export default function FeatureHub({
  engineRef, refreshLayers, refreshObjectProps, syncActiveToCollab,
  selectedIds, objectProps, zoom, activeTool, pages, currentPageId
}: FeatureHubProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showColorPanel, setShowColorPanel] = useState(false)
  const [showGradientEditor, setShowGradientEditor] = useState(false)
  const [showEffectsPanel, setShowEffectsPanel] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showAssetLibrary, setShowAssetLibrary] = useState(false)
  const [showCollabPanel, setShowCollabPanel] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showHelpPanel, setShowHelpPanel] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showDensitySelector, setShowDensitySelector] = useState(false)
  const [showPrototypePanel, setShowPrototypePanel] = useState(false)
  const [showDesignTokens, setShowDesignTokens] = useState(false)
  const [showInspectCode, setShowInspectCode] = useState(false)
  const [showDocSettings, setShowDocSettings] = useState(false)
  const [showBatchExport, setShowBatchExport] = useState(false)
  const [showPluginManager, setShowPluginManager] = useState(false)
  const [showShortcutCustomizer, setShowShortcutCustomizer] = useState(false)
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const [showSnapSettings, setShowSnapSettings] = useState(false)
  const [showAccessibility, setShowAccessibility] = useState(false)
  const [showExportHistory, setShowExportHistory] = useState(false)
  const [showDefaultStyles, setShowDefaultStyles] = useState(false)
  const [showColorContrast, setShowColorContrast] = useState(false)
  const [showShapePresets, setShowShapePresets] = useState(false)
  const [showImageFilters, setShowImageFilters] = useState(false)
  const [showStylePresets, setShowStylePresets] = useState(false)
  const [showDevicePreview, setShowDevicePreview] = useState(false)
  const [showAutoLayout, setShowAutoLayout] = useState(false)
  const [showAnimationPanel, setShowAnimationPanel] = useState(false)
  const [showHandoffSpecs, setShowHandoffSpecs] = useState(false)
  const [showDesignLint, setShowDesignLint] = useState(false)
  const [showExportPreview, setShowExportPreview] = useState(false)
  const [showComponentLibrary, setShowComponentLibrary] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const [colorPanelMode, setColorPanelMode] = useState<'fill' | 'stroke'>('fill')
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [assetSearch, setAssetSearch] = useState('')
  const [assetCategory, setAssetCategory] = useState('Icons')
  const [layerFilter, setLayerFilter] = useState('All')
  const [layerSort, setLayerSort] = useState('order')
  const [annotationTool, setAnnotationTool] = useState('pen')
  const [annotationColor, setAnnotationColor] = useState('#FF0000')
  const [inspectFormat, setInspectFormat] = useState('jsx')
  const [autoLayoutDir, setAutoLayoutDir] = useState('vertical')
  const [autoLayoutGap, setAutoLayoutGap] = useState(8)
  const [autoLayoutPadding, setAutoLayoutPadding] = useState(16)
  const [animationType, setAnimationType] = useState('none')
  const [animationDuration, setAnimationDuration] = useState(300)
  const [animationEasing, setAnimationEasing] = useState('ease')
  const [animationDelay, setAnimationDelay] = useState(0)
  const [exportFormat, setExportFormat] = useState('PNG')
  const [exportScale, setExportScale] = useState(2)
  const [exportQuality, setExportQuality] = useState(90)
  const [componentSearch, setComponentSearch] = useState('')
  const [devicePreviewDevice, setDevicePreviewDevice] = useState('iphone14')
  const [imageBrightness, setImageBrightness] = useState(0)
  const [imageContrast, setImageContrast] = useState(0)
  const [imageSaturation, setImageSaturation] = useState(0)

  // Selective store subscriptions to avoid re-renders on every state change (e.g. cursor position ~60fps)
  const autoSaveEnabled = useDesignStore(s => s.autoSaveEnabled)
  const showLayoutGrid = useDesignStore(s => s.showLayoutGrid)
  const showBaselineGrid = useDesignStore(s => s.showBaselineGrid)
  const recentColors = useDesignStore(s => s.recentColors)
  const favoriteColors = useDesignStore(s => s.favoriteColors)
  const theme = useDesignStore(s => s.theme)
  const accentColor = useDesignStore(s => s.accentColor)
  const uiDensity = useDesignStore(s => s.uiDensity)
  const showAlignmentGuides = useDesignStore(s => s.showAlignmentGuides)
  const highContrastMode = useDesignStore(s => s.highContrastMode)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!useDesignStore.getState().keyboardShortcutsEnabled) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        e.preventDefault()
        setShowFindReplace(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const runEngine = useCallback((method: string, ...args: any[]) => {
    const engine = engineRef.current
    if (!engine) return
    const fn = (engine as any)[method]
    if (typeof fn === 'function') {
      const result = fn.call(engine, ...args)
      if (result instanceof Promise) {
        result.then(() => { refreshLayers(); refreshObjectProps() })
      } else {
        refreshLayers()
        refreshObjectProps()
      }
      syncActiveToCollab()
    }
  }, [engineRef, refreshLayers, refreshObjectProps, syncActiveToCollab])

  const commands = useMemo(() => {
    const cmds: { id: string; label: string; shortcut?: string; category: string; action: () => void }[] = []
    const shapes: [string, string][] = [
      ['addRect', 'Rectangle'], ['addEllipse', 'Ellipse'], ['addCircle', 'Circle'],
      ['addTriangle', 'Triangle'], ['addLine', 'Line'], ['addText', 'Text'],
      ['addStar', 'Star'], ['addArrow', 'Arrow'], ['addHeart', 'Heart'],
      ['addPolygon', 'Polygon'], ['addCross', 'Cross'], ['addDiamond', 'Diamond'],
      ['addOctagon', 'Octagon'], ['addPentagon', 'Pentagon'], ['addCloud', 'Cloud'],
      ['addSpeechBubble', 'Speech Bubble'], ['addConnector', 'Connector'],
      ['addCallout', 'Callout'], ['addBadge', 'Badge'], ['addStickyNote', 'Sticky Note'],
      ['addRoundedRect', 'Rounded Rectangle'], ['addSquare', 'Square'],
      ['addHorizontalLine', 'Horizontal Line'], ['addVerticalLine', 'Vertical Line'],
      ['addPieSlice', 'Pie Slice'], ['addChip', 'Chip'],
      ['addHeading', 'Heading Text'], ['addSubheading', 'Subheading Text'],
      ['addBodyText', 'Body Text'], ['addCaption', 'Caption Text'],
    ]
    shapes.forEach(([method, label]) => {
      cmds.push({ id: `insert-${method}`, label: `Insert ${label}`, category: 'Insert', action: () => runEngine(method) })
    })
    const uiShapes: [string, string][] = [
      ['addButton', 'Button'], ['addInputField', 'Input Field'], ['addCheckbox', 'Checkbox'],
      ['addRadioButton', 'Radio Button'], ['addDropdown', 'Dropdown'], ['addToggleSwitch', 'Toggle Switch'],
      ['addProgressBar', 'Progress Bar'], ['addNavBar', 'Navigation Bar'], ['addTabBar', 'Tab Bar'],
      ['addCard', 'Card'], ['addHeaderBar', 'Header Bar'], ['addFooter', 'Footer'],
      ['addSidebar', 'Sidebar'], ['addModalOverlay', 'Modal Overlay'], ['addTooltip', 'Tooltip'],
      ['addListItem', 'List Item'], ['addImagePlaceholder', 'Image Placeholder'],
      ['addAvatarPlaceholder', 'Avatar'], ['addIconButton', 'Icon Button'], ['addDivider', 'Divider'],
      ['addSkeleton', 'Skeleton Loader'], ['addBreadcrumb', 'Breadcrumb'],
      ['addStepIndicator', 'Step Indicator'], ['addStatDisplay', 'Stat Display'],
      ['addPricingCard', 'Pricing Card'], ['addFeatureCard', 'Feature Card'],
      ['addTestimonialCard', 'Testimonial Card'], ['addProfileCard', 'Profile Card'],
      ['addHeroSection', 'Hero Section'], ['addFormLayout', 'Form Layout'],
      ['addNotificationBadge', 'Notification Badge'], ['addStatusDot', 'Status Dot'],
      ['addStarRating', 'Star Rating'], ['addColorSwatch', 'Color Swatch'],
      ['addColorPalette', 'Color Palette'], ['addCodeBlock', 'Code Block'],
      ['addBlockquote', 'Blockquote'], ['addSectionHeading', 'Section Heading'],
      ['addAlertBanner', 'Alert Banner'], ['addLoadingSpinner', 'Loading Spinner'],
      ['addOrderedList', 'Ordered List'], ['addUnorderedList', 'Unordered List'],
      ['addTableGrid', 'Table Grid'],
    ]
    uiShapes.forEach(([method, label]) => {
      cmds.push({ id: `insert-ui-${method}`, label: `Insert ${label}`, category: 'Insert UI', action: () => runEngine(method) })
    })
    cmds.push({ id: 'select-all', label: 'Select All', shortcut: 'Ctrl+A', category: 'Edit', action: () => runEngine('selectAll') })
    cmds.push({ id: 'deselect-all', label: 'Deselect All', category: 'Edit', action: () => runEngine('deselectAll') })
    cmds.push({ id: 'invert-selection', label: 'Invert Selection', category: 'Edit', action: () => runEngine('invertSelection') })
    cmds.push({ id: 'group', label: 'Group Selected', shortcut: 'Ctrl+G', category: 'Edit', action: () => runEngine('groupSelected') })
    cmds.push({ id: 'ungroup', label: 'Ungroup Selected', shortcut: 'Ctrl+Shift+G', category: 'Edit', action: () => runEngine('ungroupSelected') })
    cmds.push({ id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', category: 'Edit', action: () => runEngine('duplicate') })
    cmds.push({ id: 'delete', label: 'Delete Selected', shortcut: 'Del', category: 'Edit', action: () => runEngine('deleteSelected') })
    cmds.push({ id: 'lock', label: 'Lock Object', category: 'Edit', action: () => runEngine('lockObject', true) })
    cmds.push({ id: 'unlock', label: 'Unlock All', category: 'Edit', action: () => runEngine('unlockAllObjects') })
    cmds.push({ id: 'bring-front', label: 'Bring to Front', category: 'Arrange', action: () => runEngine('bringToFront') })
    cmds.push({ id: 'send-back', label: 'Send to Back', category: 'Arrange', action: () => runEngine('sendToBack') })
    cmds.push({ id: 'bring-forward', label: 'Bring Forward', category: 'Arrange', action: () => runEngine('bringForward') })
    cmds.push({ id: 'send-backward', label: 'Send Backward', category: 'Arrange', action: () => runEngine('sendBackward') })
    const aligns: [string, string][] = [['left', 'Align Left'], ['center', 'Align Center'], ['right', 'Align Right'],
      ['top', 'Align Top'], ['middle', 'Align Middle'], ['bottom', 'Align Bottom']]
    aligns.forEach(([dir, label]) => {
      cmds.push({ id: `align-${dir}`, label, category: 'Align', action: () => runEngine('alignObjects', dir) })
    })
    cmds.push({ id: 'distribute-h', label: 'Distribute Horizontally', category: 'Align', action: () => runEngine('distributeObjects', 'horizontal') })
    cmds.push({ id: 'distribute-v', label: 'Distribute Vertically', category: 'Align', action: () => runEngine('distributeObjects', 'vertical') })
    cmds.push({ id: 'rotate-90', label: 'Rotate 90 CW', shortcut: 'Shift+R', category: 'Transform', action: () => runEngine('rotateBy', 90) })
    cmds.push({ id: 'rotate-180', label: 'Rotate 180', category: 'Transform', action: () => runEngine('rotateBy', 180) })
    cmds.push({ id: 'rotate-270', label: 'Rotate 90 CCW', category: 'Transform', action: () => runEngine('rotateBy', -90) })
    cmds.push({ id: 'flip-h', label: 'Flip Horizontal', shortcut: 'Shift+H', category: 'Transform', action: () => runEngine('flipHorizontal') })
    cmds.push({ id: 'flip-v', label: 'Flip Vertical', shortcut: 'Shift+V', category: 'Transform', action: () => runEngine('flipVertical') })
    cmds.push({ id: 'scale-2x', label: 'Double Size', category: 'Transform', action: () => runEngine('doubleSize') })
    cmds.push({ id: 'scale-half', label: 'Halve Size', category: 'Transform', action: () => runEngine('halveSize') })
    cmds.push({ id: 'center-canvas', label: 'Center on Canvas', category: 'Transform', action: () => runEngine('centerOnCanvas') })
    cmds.push({ id: 'match-width', label: 'Match Width', category: 'Transform', action: () => runEngine('matchWidth') })
    cmds.push({ id: 'match-height', label: 'Match Height', category: 'Transform', action: () => runEngine('matchHeight') })
    cmds.push({ id: 'match-size', label: 'Match Size', category: 'Transform', action: () => runEngine('matchSize') })
    cmds.push({ id: 'stack-v', label: 'Stack Vertically', category: 'Transform', action: () => runEngine('stackVertically') })
    cmds.push({ id: 'stack-h', label: 'Stack Horizontally', category: 'Transform', action: () => runEngine('stackHorizontally') })
    cmds.push({ id: 'arrange-grid', label: 'Arrange in Grid', category: 'Transform', action: () => runEngine('arrangeInGrid') })
    cmds.push({ id: 'arrange-circle', label: 'Arrange in Circle', category: 'Transform', action: () => runEngine('arrangeInCircle') })
    cmds.push({ id: 'reset-transforms', label: 'Reset Transforms', category: 'Transform', action: () => runEngine('resetTransforms') })
    cmds.push({ id: 'randomize-colors', label: 'Randomize Colors', category: 'Transform', action: () => runEngine('randomizeColors') })
    cmds.push({ id: 'bool-union', label: 'Boolean Union', category: 'Boolean', action: () => runEngine('booleanUnion') })
    cmds.push({ id: 'bool-subtract', label: 'Boolean Subtract', category: 'Boolean', action: () => runEngine('booleanSubtract') })
    cmds.push({ id: 'bool-intersect', label: 'Boolean Intersect', category: 'Boolean', action: () => runEngine('booleanIntersect') })
    cmds.push({ id: 'bool-exclude', label: 'Boolean Exclude', category: 'Boolean', action: () => runEngine('booleanExclude') })
    cmds.push({ id: 'text-bold', label: 'Toggle Bold', shortcut: 'Ctrl+B', category: 'Text', action: () => runEngine('toggleBold') })
    cmds.push({ id: 'text-italic', label: 'Toggle Italic', shortcut: 'Ctrl+I', category: 'Text', action: () => runEngine('toggleItalic') })
    cmds.push({ id: 'text-underline', label: 'Toggle Underline', shortcut: 'Ctrl+U', category: 'Text', action: () => runEngine('toggleUnderline') })
    cmds.push({ id: 'text-strikethrough', label: 'Toggle Strikethrough', category: 'Text', action: () => runEngine('toggleStrikethrough') })
    cmds.push({ id: 'text-uppercase', label: 'To Uppercase', category: 'Text', action: () => runEngine('textToUpperCase') })
    cmds.push({ id: 'text-lowercase', label: 'To Lowercase', category: 'Text', action: () => runEngine('textToLowerCase') })
    cmds.push({ id: 'text-titlecase', label: 'To Title Case', category: 'Text', action: () => runEngine('textToTitleCase') })
    cmds.push({ id: 'font-increase', label: 'Increase Font Size', category: 'Text', action: () => runEngine('increaseFontSize') })
    cmds.push({ id: 'font-decrease', label: 'Decrease Font Size', category: 'Text', action: () => runEngine('decreaseFontSize') })
    cmds.push({ id: 'remove-fill', label: 'Remove Fill', category: 'Style', action: () => runEngine('removeFill') })
    cmds.push({ id: 'remove-stroke', label: 'Remove Stroke', category: 'Style', action: () => runEngine('removeStroke') })
    cmds.push({ id: 'remove-shadow', label: 'Remove Shadow', category: 'Style', action: () => runEngine('removeShadow') })
    cmds.push({ id: 'export-png', label: 'Export as PNG', category: 'Export', action: () => runEngine('exportToPNG') })
    cmds.push({ id: 'export-jpg', label: 'Export as JPG', category: 'Export', action: () => runEngine('exportToJPG') })
    cmds.push({ id: 'export-svg', label: 'Export as SVG', category: 'Export', action: () => runEngine('exportToSVG') })
    cmds.push({ id: 'export-webp', label: 'Export as WebP', category: 'Export', action: () => runEngine('exportToWebP') })
    cmds.push({ id: 'export-json', label: 'Export as JSON', category: 'Export', action: () => runEngine('exportToJSON') })
    cmds.push({ id: 'toggle-dark', label: 'Toggle Dark Mode', category: 'View', action: () => useDesignStore.getState().toggleDarkMode() })
    cmds.push({ id: 'toggle-minimap', label: 'Toggle Minimap', category: 'View', action: () => useDesignStore.getState().toggleMinimap() })
    cmds.push({ id: 'toggle-statusbar', label: 'Toggle Status Bar', category: 'View', action: () => useDesignStore.getState().toggleStatusBar() })
    cmds.push({ id: 'toggle-rulers', label: 'Toggle Rulers', category: 'View', action: () => useDesignStore.getState().toggleRulers() })
    cmds.push({ id: 'toggle-grid', label: 'Toggle Grid', category: 'View', action: () => useDesignStore.getState().toggleGrid() })
    cmds.push({ id: 'toggle-objinfo', label: 'Toggle Object Info', category: 'View', action: () => useDesignStore.getState().toggleObjectInfo() })
    cmds.push({ id: 'toggle-guides', label: 'Toggle Distance Guides', category: 'View', action: () => useDesignStore.getState().toggleDistanceGuides() })
    cmds.push({ id: 'toggle-snap-obj', label: 'Toggle Snap to Objects', category: 'View', action: () => useDesignStore.getState().toggleSnapToObjects() })
    cmds.push({ id: 'toggle-high-contrast', label: 'Toggle High Contrast', category: 'View', action: () => useDesignStore.getState().toggleHighContrastMode() })
    cmds.push({ id: 'toggle-alignment-guides', label: 'Toggle Alignment Guides', category: 'View', action: () => useDesignStore.getState().toggleAlignmentGuides() })
    cmds.push({ id: 'toggle-pixel-grid', label: 'Toggle Pixel Grid', category: 'View', action: () => useDesignStore.getState().togglePixelGrid() })
    cmds.push({ id: 'open-cmd-palette', label: 'Command Palette', shortcut: 'Ctrl+K', category: 'Panel', action: () => setShowCommandPalette(true) })
    cmds.push({ id: 'open-find', label: 'Find & Replace', shortcut: 'Ctrl+F', category: 'Panel', action: () => setShowFindReplace(true) })
    cmds.push({ id: 'open-fill-color', label: 'Fill Color Picker', category: 'Panel', action: () => { setColorPanelMode('fill'); setShowColorPanel(true) } })
    cmds.push({ id: 'open-stroke-color', label: 'Stroke Color Picker', category: 'Panel', action: () => { setColorPanelMode('stroke'); setShowColorPanel(true) } })
    cmds.push({ id: 'open-gradient', label: 'Gradient Editor', category: 'Panel', action: () => setShowGradientEditor(true) })
    cmds.push({ id: 'open-effects', label: 'Effects Panel', category: 'Panel', action: () => setShowEffectsPanel(true) })
    cmds.push({ id: 'open-version-history', label: 'Version History', category: 'Panel', action: () => setShowVersionHistory(true) })
    cmds.push({ id: 'open-asset-library', label: 'Asset Library', category: 'Panel', action: () => setShowAssetLibrary(true) })
    cmds.push({ id: 'open-collab', label: 'Collaboration Panel', category: 'Panel', action: () => setShowCollabPanel(true) })
    cmds.push({ id: 'open-notifications', label: 'Notifications', category: 'Panel', action: () => setShowNotifications(true) })
    cmds.push({ id: 'open-help', label: 'Help', category: 'Panel', action: () => setShowHelpPanel(true) })
    cmds.push({ id: 'open-theme', label: 'Theme Selector', category: 'Panel', action: () => setShowThemeSelector(true) })
    cmds.push({ id: 'open-density', label: 'UI Density', category: 'Panel', action: () => setShowDensitySelector(true) })
    cmds.push({ id: 'open-prototype', label: 'Prototype Links', category: 'Panel', action: () => setShowPrototypePanel(true) })
    cmds.push({ id: 'open-tokens', label: 'Design Tokens', category: 'Panel', action: () => setShowDesignTokens(true) })
    cmds.push({ id: 'open-inspect', label: 'Inspect Code', category: 'Panel', action: () => setShowInspectCode(true) })
    cmds.push({ id: 'open-doc-settings', label: 'Document Settings', category: 'Panel', action: () => setShowDocSettings(true) })
    cmds.push({ id: 'open-batch-export', label: 'Batch Export', category: 'Panel', action: () => setShowBatchExport(true) })
    cmds.push({ id: 'open-plugins', label: 'Plugin Manager', category: 'Panel', action: () => setShowPluginManager(true) })
    cmds.push({ id: 'open-shortcuts', label: 'Customize Shortcuts', category: 'Panel', action: () => setShowShortcutCustomizer(true) })
    cmds.push({ id: 'open-performance', label: 'Performance Monitor', category: 'Panel', action: () => setShowPerformanceMonitor(true) })
    cmds.push({ id: 'open-snap-settings', label: 'Snap Settings', category: 'Panel', action: () => setShowSnapSettings(true) })
    cmds.push({ id: 'open-accessibility', label: 'Accessibility', category: 'Panel', action: () => setShowAccessibility(true) })
    cmds.push({ id: 'open-export-history', label: 'Export History', category: 'Panel', action: () => setShowExportHistory(true) })
    cmds.push({ id: 'open-default-styles', label: 'Default Styles', category: 'Panel', action: () => setShowDefaultStyles(true) })
    cmds.push({ id: 'open-contrast', label: 'Color Contrast Checker', category: 'Panel', action: () => setShowColorContrast(true) })
    cmds.push({ id: 'open-shapes', label: 'Shape Presets', category: 'Panel', action: () => setShowShapePresets(true) })
    cmds.push({ id: 'open-filters', label: 'Image Filters', category: 'Panel', action: () => setShowImageFilters(true) })
    cmds.push({ id: 'open-style-presets', label: 'Style Presets', category: 'Panel', action: () => setShowStylePresets(true) })
    cmds.push({ id: 'open-device-preview', label: 'Device Preview', category: 'Panel', action: () => setShowDevicePreview(true) })
    cmds.push({ id: 'open-auto-layout', label: 'Auto Layout', category: 'Panel', action: () => setShowAutoLayout(true) })
    cmds.push({ id: 'open-animation', label: 'Animation Panel', category: 'Panel', action: () => setShowAnimationPanel(true) })
    cmds.push({ id: 'open-handoff', label: 'Handoff Specs', category: 'Panel', action: () => setShowHandoffSpecs(true) })
    cmds.push({ id: 'open-lint', label: 'Design Lint', category: 'Panel', action: () => setShowDesignLint(true) })
    cmds.push({ id: 'open-export-preview', label: 'Export Preview', category: 'Panel', action: () => setShowExportPreview(true) })
    cmds.push({ id: 'open-components', label: 'Component Library', category: 'Panel', action: () => setShowComponentLibrary(true) })
    cmds.push({ id: 'open-onboarding', label: 'Onboarding Tour', category: 'Panel', action: () => setShowOnboarding(true) })
    cmds.push({ id: 'zoom-fit', label: 'Zoom to Fit', shortcut: 'Ctrl+1', category: 'Zoom', action: () => { engineRef.current?.zoomToFit() } })
    cmds.push({ id: 'zoom-fit-w', label: 'Zoom to Fit Width', category: 'Zoom', action: () => { engineRef.current?.zoomToFitWidth() } })
    cmds.push({ id: 'zoom-fit-h', label: 'Zoom to Fit Height', category: 'Zoom', action: () => { engineRef.current?.zoomToFitHeight() } })
    cmds.push({ id: 'zoom-reset', label: 'Reset Zoom (100%)', shortcut: 'Ctrl+0', category: 'Zoom', action: () => { engineRef.current?.resetZoom() } })
    return cmds
  }, [runEngine, engineRef])

  const hasSelection = selectedIds.length > 0
  const hasMultiSelect = selectedIds.length > 1
  const isTextSelected = objectProps?.type === 'textbox' || objectProps?.type === 'i-text' || objectProps?.type === 'text'

  const insertMenuItems = [
    { label: 'Rectangle', action: () => runEngine('addRect'), shortcut: 'R' },
    { label: 'Ellipse', action: () => runEngine('addEllipse'), shortcut: 'O' },
    { label: 'Line', action: () => runEngine('addLine'), shortcut: 'L' },
    { label: 'Text', action: () => runEngine('addText'), shortcut: 'T' },
    { label: 'Frame', action: () => runEngine('addFrame'), shortcut: 'F' },
    { label: '---' },
    { label: 'Star', action: () => runEngine('addStar') },
    { label: 'Arrow', action: () => runEngine('addArrow') },
    { label: 'Heart', action: () => runEngine('addHeart') },
    { label: 'Diamond', action: () => runEngine('addDiamond') },
    { label: 'Cloud', action: () => runEngine('addCloud') },
    { label: 'Cross', action: () => runEngine('addCross') },
    { label: 'Pentagon', action: () => runEngine('addPentagon') },
    { label: 'Octagon', action: () => runEngine('addOctagon') },
    { label: 'Badge', action: () => runEngine('addBadge') },
    { label: 'Callout', action: () => runEngine('addCallout') },
    { label: 'Sticky Note', action: () => runEngine('addStickyNote') },
    { label: 'Speech Bubble', action: () => runEngine('addSpeechBubble') },
    { label: '---' },
    { label: 'Button', action: () => runEngine('addButton') },
    { label: 'Card', action: () => runEngine('addCard') },
    { label: 'Input Field', action: () => runEngine('addInputField') },
    { label: 'Checkbox', action: () => runEngine('addCheckbox') },
    { label: 'Nav Bar', action: () => runEngine('addNavBar') },
    { label: 'Hero Section', action: () => runEngine('addHeroSection') },
    { label: 'Pricing Card', action: () => runEngine('addPricingCard') },
    { label: 'Profile Card', action: () => runEngine('addProfileCard') },
    { label: 'Table Grid', action: () => runEngine('addTableGrid') },
  ]

  return (
    <>
      {/* MENU BAR */}
      <div className="fixed top-0 left-[170px] h-11 z-[51] flex items-center gap-0.5">
        <div className="relative">
          <button onClick={() => { setShowInsertMenu(!showInsertMenu); setShowEditMenu(false); setShowFormatMenu(false) }}
            className="px-2.5 py-1.5 text-xs text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover rounded-lg transition-colors font-medium">Insert</button>
          {showInsertMenu && (<>
            <div className="fixed inset-0 z-40" onClick={() => setShowInsertMenu(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-panel-lg py-1 w-48 max-h-[70vh] overflow-y-auto">
              {insertMenuItems.map((item, i) => item.label === '---' ? (
                <div key={i} className="h-px bg-canvas-border my-1" />
              ) : (
                <button key={i} onClick={() => { item.action?.(); setShowInsertMenu(false) }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-canvas-text hover:bg-canvas-hover transition-colors">
                  <span>{item.label}</span>
                  {item.shortcut && <span className="text-canvas-text-tertiary text-[10px]">{item.shortcut}</span>}
                </button>
              ))}
            </div>
          </>)}
        </div>
        <div className="relative">
          <button onClick={() => { setShowEditMenu(!showEditMenu); setShowInsertMenu(false); setShowFormatMenu(false) }}
            className="px-2.5 py-1.5 text-xs text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover rounded-lg transition-colors font-medium">Edit</button>
          {showEditMenu && (<>
            <div className="fixed inset-0 z-40" onClick={() => setShowEditMenu(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-panel-lg py-1 w-52 max-h-[70vh] overflow-y-auto">
              <MenuBtn label="Select All" shortcut="Ctrl+A" onClick={() => { runEngine('selectAll'); setShowEditMenu(false) }} />
              <MenuBtn label="Deselect All" onClick={() => { runEngine('deselectAll'); setShowEditMenu(false) }} />
              <MenuBtn label="Invert Selection" onClick={() => { runEngine('invertSelection'); setShowEditMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="Group" shortcut="Ctrl+G" onClick={() => { runEngine('groupSelected'); setShowEditMenu(false) }} />
              <MenuBtn label="Ungroup" shortcut="Ctrl+Shift+G" onClick={() => { runEngine('ungroupSelected'); setShowEditMenu(false) }} />
              <MenuBtn label="Duplicate" shortcut="Ctrl+D" onClick={() => { runEngine('duplicate'); setShowEditMenu(false) }} />
              <MenuBtn label="Delete" shortcut="Del" onClick={() => { runEngine('deleteSelected'); setShowEditMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="Lock Object" onClick={() => { runEngine('lockObject', true); setShowEditMenu(false) }} />
              <MenuBtn label="Unlock All" onClick={() => { runEngine('unlockAllObjects'); setShowEditMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="Align Left" onClick={() => { runEngine('alignObjects', 'left'); setShowEditMenu(false) }} />
              <MenuBtn label="Align Center" onClick={() => { runEngine('alignObjects', 'center'); setShowEditMenu(false) }} />
              <MenuBtn label="Align Right" onClick={() => { runEngine('alignObjects', 'right'); setShowEditMenu(false) }} />
              <MenuBtn label="Distribute H" onClick={() => { runEngine('distributeObjects', 'horizontal'); setShowEditMenu(false) }} />
              <MenuBtn label="Distribute V" onClick={() => { runEngine('distributeObjects', 'vertical'); setShowEditMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="Boolean Union" onClick={() => { runEngine('booleanUnion'); setShowEditMenu(false) }} />
              <MenuBtn label="Boolean Subtract" onClick={() => { runEngine('booleanSubtract'); setShowEditMenu(false) }} />
              <MenuBtn label="Boolean Intersect" onClick={() => { runEngine('booleanIntersect'); setShowEditMenu(false) }} />
              <MenuBtn label="Boolean Exclude" onClick={() => { runEngine('booleanExclude'); setShowEditMenu(false) }} />
            </div>
          </>)}
        </div>
        <div className="relative">
          <button onClick={() => { setShowFormatMenu(!showFormatMenu); setShowInsertMenu(false); setShowEditMenu(false) }}
            className="px-2.5 py-1.5 text-xs text-canvas-text-secondary hover:text-canvas-text hover:bg-canvas-hover rounded-lg transition-colors font-medium">Format</button>
          {showFormatMenu && (<>
            <div className="fixed inset-0 z-40" onClick={() => setShowFormatMenu(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-panel-lg py-1 w-52 max-h-[70vh] overflow-y-auto">
              <MenuBtn label="Bold" shortcut="Ctrl+B" onClick={() => { runEngine('toggleBold'); setShowFormatMenu(false) }} />
              <MenuBtn label="Italic" shortcut="Ctrl+I" onClick={() => { runEngine('toggleItalic'); setShowFormatMenu(false) }} />
              <MenuBtn label="Underline" shortcut="Ctrl+U" onClick={() => { runEngine('toggleUnderline'); setShowFormatMenu(false) }} />
              <MenuBtn label="Strikethrough" onClick={() => { runEngine('toggleStrikethrough'); setShowFormatMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="To Uppercase" onClick={() => { runEngine('textToUpperCase'); setShowFormatMenu(false) }} />
              <MenuBtn label="To Lowercase" onClick={() => { runEngine('textToLowerCase'); setShowFormatMenu(false) }} />
              <MenuBtn label="To Title Case" onClick={() => { runEngine('textToTitleCase'); setShowFormatMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="Rotate 90 CW" shortcut="Shift+R" onClick={() => { runEngine('rotateBy', 90); setShowFormatMenu(false) }} />
              <MenuBtn label="Rotate 90 CCW" onClick={() => { runEngine('rotateBy', -90); setShowFormatMenu(false) }} />
              <MenuBtn label="Flip Horizontal" shortcut="Shift+H" onClick={() => { runEngine('flipHorizontal'); setShowFormatMenu(false) }} />
              <MenuBtn label="Flip Vertical" shortcut="Shift+V" onClick={() => { runEngine('flipVertical'); setShowFormatMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="Double Size" onClick={() => { runEngine('doubleSize'); setShowFormatMenu(false) }} />
              <MenuBtn label="Halve Size" onClick={() => { runEngine('halveSize'); setShowFormatMenu(false) }} />
              <MenuBtn label="Center on Canvas" onClick={() => { runEngine('centerOnCanvas'); setShowFormatMenu(false) }} />
              <MenuBtn label="Stack Vertically" onClick={() => { runEngine('stackVertically'); setShowFormatMenu(false) }} />
              <MenuBtn label="Stack Horizontally" onClick={() => { runEngine('stackHorizontally'); setShowFormatMenu(false) }} />
              <MenuBtn label="Arrange in Grid" onClick={() => { runEngine('arrangeInGrid'); setShowFormatMenu(false) }} />
              <div className="h-px bg-canvas-border my-1" />
              <MenuBtn label="Remove Fill" onClick={() => { runEngine('removeFill'); setShowFormatMenu(false) }} />
              <MenuBtn label="Remove Stroke" onClick={() => { runEngine('removeStroke'); setShowFormatMenu(false) }} />
              <MenuBtn label="Remove Shadow" onClick={() => { runEngine('removeShadow'); setShowFormatMenu(false) }} />
              <MenuBtn label="Randomize Colors" onClick={() => { runEngine('randomizeColors'); setShowFormatMenu(false) }} />
            </div>
          </>)}
        </div>
      </div>

      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} commands={commands} />

      <TextToolbar visible={isTextSelected && hasSelection} fontFamily={objectProps?.fontFamily || 'Inter'} fontSize={objectProps?.fontSize || 16} bold={objectProps?.fontWeight === 'bold'} italic={objectProps?.fontStyle === 'italic'} underline={objectProps?.underline || false} align={objectProps?.textAlign || 'left'} onFontChange={(f: string) => runEngine('setFontFamily', f)} onSizeChange={(s: number) => runEngine('setTextProperty', 'fontSize', s)} onBoldToggle={() => runEngine('toggleBold')} onItalicToggle={() => runEngine('toggleItalic')} onUnderlineToggle={() => runEngine('toggleUnderline')} onAlignChange={(a: string) => runEngine('setTextAlign', a)} fonts={FONT_LIST} />

      {activeTool === 'comment' && <AnnotationToolbar tool={annotationTool} onToolChange={setAnnotationTool} color={annotationColor} onColorChange={setAnnotationColor} />}
      <ToolOptionsBar tool={activeTool} />

      {hasSelection && (
        <div className="fixed right-[280px] top-12 z-[100]">
          <BlendModeSelector value={objectProps?.globalCompositeOperation || 'normal'} onChange={(mode: string) => runEngine('setBlendMode', mode)} />
        </div>
      )}

      {hasSelection && (
        <div className="fixed right-[280px] top-[120px] z-[100] bg-white rounded-lg shadow-lg border w-[200px]">
          <ArrangeControls onBringForward={() => runEngine('bringForward')} onSendBackward={() => runEngine('sendBackward')} onBringToFront={() => runEngine('bringToFront')} onSendToBack={() => runEngine('sendToBack')} />
          <FlipControls onFlipH={() => runEngine('flipHorizontal')} onFlipV={() => runEngine('flipVertical')} />
          <DuplicateControls onDuplicate={() => runEngine('duplicate')} onDuplicateInPlace={() => runEngine('duplicate')} onCloneWithOffset={(dx: number, dy: number) => runEngine('duplicate')} />
          {hasMultiSelect && <GroupControls isGroup={objectProps?.type === 'group'} onGroup={() => runEngine('groupSelected')} onUngroup={() => runEngine('ungroupSelected')} onEnterGroup={() => {}} />}
        </div>
      )}

      {hasSelection && (
        <div className="fixed right-[280px] top-[310px] z-[100] bg-white rounded-lg shadow-lg border w-[200px]">
          <TransformPanel open={true} x={objectProps?.left || 0} y={objectProps?.top || 0} width={objectProps?.width || 0} height={objectProps?.height || 0} rotation={objectProps?.angle || 0} onPositionChange={(x: number, y: number) => runEngine('setObjectPosition', x, y)} onSizeChange={(w: number, h: number) => runEngine('setObjectSize', w, h)} onRotationChange={(a: number) => runEngine('setObjectRotation', a)} onReset={() => runEngine('resetTransforms')} constrain={false} onToggleConstrain={() => {}} />
        </div>
      )}

      {isTextSelected && (
        <div className="fixed right-[280px] top-[480px] z-[100] bg-white rounded-lg shadow-lg border w-[200px]">
          <TextSpacingControls letterSpacing={objectProps?.charSpacing || 0} lineHeight={objectProps?.lineHeight || 1.2} onLetterSpacingChange={(v: number) => runEngine('setCharSpacing', v)} onLineHeightChange={(v: number) => runEngine('setLineHeight', v)} />
        </div>
      )}

      {hasMultiSelect && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-white rounded-lg shadow-lg border">
          <BooleanOperationsBar onUnion={() => runEngine('booleanUnion')} onSubtract={() => runEngine('booleanSubtract')} onIntersect={() => runEngine('booleanIntersect')} onExclude={() => runEngine('booleanExclude')} disabled={false} />
        </div>
      )}

      <ObjectAlignmentBar visible={hasMultiSelect} onAlign={(dir: string) => runEngine('alignObjects', dir)} onDistribute={(dir: string) => runEngine('distributeObjects', dir)} />
      <MultiSelectActions count={selectedIds.length} onGroup={() => runEngine('groupSelected')} onUngroup={() => runEngine('ungroupSelected')} onAlignLeft={() => runEngine('alignObjects', 'left')} onAlignCenter={() => runEngine('alignObjects', 'center')} onAlignRight={() => runEngine('alignObjects', 'right')} onDistributeH={() => runEngine('distributeObjects', 'horizontal')} onDistributeV={() => runEngine('distributeObjects', 'vertical')} onFlatten={() => runEngine('flatten')} />
      {isTextSelected && <RecentFontsList fonts={FONT_LIST.slice(0, 5)} onSelect={(f: string) => runEngine('setFontFamily', f)} />}

      <QuickActionButton label="Quick Actions" icon="+" onClick={() => setShowCommandPalette(true)} />
      <AutoSaveIndicator enabled={autoSaveEnabled} lastSaved={Date.now()} hasUnsaved={false} interval={30} />
      <CanvasInfoBar visible={true} width={typeof window !== 'undefined' ? window.innerWidth : 1920} height={typeof window !== 'undefined' ? window.innerHeight : 1080} zoom={zoom} objectCount={engineRef.current?.getObjectCount() || 0} selectedCount={selectedIds.length} />
      <LayoutGridOverlay visible={showLayoutGrid} columns={12} gutter={20} margin={40} canvasWidth={typeof window !== 'undefined' ? window.innerWidth : 1920} />
      <BaselineGridOverlay visible={showBaselineGrid} size={8} />
      <BreakpointBar breakpoints={[{name:'Mobile',width:375},{name:'Tablet',width:768},{name:'Desktop',width:1440}]} active="Desktop" onSelect={() => {}} />
      <LayerFilterBar filter={layerFilter} onFilterChange={setLayerFilter} sort={layerSort} onSortChange={setLayerSort} />
      <PageThumbnails pages={pages.map(p => ({ id: p.id, name: p.name }))} currentPageId={currentPageId} onSelectPage={() => {}} showThumbnails={true} />
      <FloatingActionButton icon="+" onClick={() => setShowCommandPalette(true)} label="Quick Actions" />

      <ColorPickerPanel open={showColorPanel} onClose={() => setShowColorPanel(false)} color={colorPanelMode === 'fill' ? (objectProps?.fill || '#000000') : (objectProps?.stroke || '#000000')} onChange={(c: string) => colorPanelMode === 'fill' ? runEngine('setObjectFill', c) : runEngine('setObjectStroke', c)} mode={colorPanelMode} recentColors={recentColors || []} favoriteColors={favoriteColors || []} onAddFavorite={() => {}} />
      <GradientEditor open={showGradientEditor} onClose={() => setShowGradientEditor(false)} stops={[{offset:0,color:'#000000'},{offset:1,color:'#ffffff'}]} angle={0} onStopsChange={() => {}} onAngleChange={() => {}} onApply={() => {}} />
      <EffectsPanel open={showEffectsPanel} effects={[]} onToggle={() => {}} onValueChange={() => {}} onAdd={() => {}} />
      <FindReplaceDialog open={showFindReplace} onClose={() => setShowFindReplace(false)} onFind={() => {}} onReplace={() => {}} onReplaceAll={() => {}} />

      {showShapePresets && (
        <div className="fixed left-16 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[220px]">
          <div className="flex justify-between items-center px-3 py-2 border-b">
            <span className="text-xs font-semibold">Shape Presets</span>
            <button onClick={() => setShowShapePresets(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <ShapePresetsPanel onAddShape={(type: string) => runEngine('add' + type.charAt(0).toUpperCase() + type.slice(1))} />
        </div>
      )}

      <VersionHistoryPanel open={showVersionHistory} onClose={() => setShowVersionHistory(false)} versions={[]} onRestore={() => {}} onDelete={() => {}} />
      <AssetLibraryPanel open={showAssetLibrary} onClose={() => setShowAssetLibrary(false)} assets={[]} onInsert={() => {}} searchQuery={assetSearch} onSearchChange={setAssetSearch} category={assetCategory} onCategoryChange={setAssetCategory} />
      <CollaborationPanel open={showCollabPanel} onClose={() => setShowCollabPanel(false)} collaborators={[]} currentUserId="" onFollowUser={() => {}} followingUserId={null} />
      <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} notifications={[]} onMarkRead={() => {}} onClearAll={() => {}} />
      <OnboardingTour open={showOnboarding} step={onboardingStep} steps={[{title:'Welcome',description:'A powerful design tool'},{title:'Shapes',description:'Use Insert menu'},{title:'Commands',description:'Press Ctrl+K'},{title:'Collab',description:'Share your room'},{title:'Export',description:'Export as PNG/SVG/JSON'}]} onNext={() => setOnboardingStep(s => s + 1)} onPrev={() => setOnboardingStep(s => Math.max(0, s - 1))} onSkip={() => setShowOnboarding(false)} />
      <HelpPanel open={showHelpPanel} onClose={() => setShowHelpPanel(false)} />

      {showThemeSelector && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Theme</span><button onClick={() => setShowThemeSelector(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <ThemeSelector theme={theme} onThemeChange={(t: string) => useDesignStore.getState().setTheme(t as any)} accentColor={accentColor || '#007AFF'} onAccentChange={(c: string) => useDesignStore.getState().setAccentColor(c)} />
        </div>
      )}

      {showDensitySelector && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">UI Density</span><button onClick={() => setShowDensitySelector(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <UIDensitySelector density={uiDensity} onChange={(d: string) => useDesignStore.getState().setUiDensity(d as any)} />
        </div>
      )}

      <PrototypeLinkPanel open={showPrototypePanel} links={[]} onAdd={() => {}} onRemove={() => {}} selectedId={selectedIds[0] || null} pages={pages.map(p => ({id:p.id,name:p.name}))} />
      <DesignTokensPanel open={showDesignTokens} onClose={() => setShowDesignTokens(false)} tokens={{}} onSet={() => {}} onRemove={() => {}} />
      <InspectCodePanel open={showInspectCode} onClose={() => setShowInspectCode(false)} format={inspectFormat} onFormatChange={setInspectFormat} code={engineRef.current?.generateCodeExport?.('css') || '// Select an object'} />

      {showDocSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setShowDocSettings(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[400px] p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Document Settings</span><button onClick={() => setShowDocSettings(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
            <DocumentSettingsPanel title="Untitled" description="" tags={[]} onTitleChange={() => {}} onDescriptionChange={() => {}} onAddTag={() => {}} onRemoveTag={() => {}} />
          </div>
        </div>
      )}

      <BatchExportDialog open={showBatchExport} onClose={() => setShowBatchExport(false)} items={[]} onExport={() => {}} onItemChange={() => {}} />
      <PluginManagerPanel open={showPluginManager} onClose={() => setShowPluginManager(false)} plugins={[]} onToggle={() => {}} />

      {showShortcutCustomizer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setShowShortcutCustomizer(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[70vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Customize Shortcuts</span><button onClick={() => setShowShortcutCustomizer(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
            <ShortcutCustomizer shortcuts={{}} onSet={() => {}} />
          </div>
        </div>
      )}

      <PerformanceMonitor visible={showPerformanceMonitor} fps={60} memory={0} objectCount={engineRef.current?.getObjectCount() || 0} />

      {showSnapSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setShowSnapSettings(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[350px] p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Snap Settings</span><button onClick={() => setShowSnapSettings(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
            <SnapSettingsPanel tolerance={10} onToleranceChange={() => {}} alignGuides={showAlignmentGuides} onToggleAlignGuides={() => useDesignStore.getState().toggleAlignmentGuides()} smartSpacing={true} onToggleSmartSpacing={() => {}} guideColor="#FF00FF" onGuideColorChange={() => {}} />
          </div>
        </div>
      )}

      {showAccessibility && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setShowAccessibility(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[350px] p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Accessibility</span><button onClick={() => setShowAccessibility(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
            <AccessibilityPanel highContrast={highContrastMode} onToggleHighContrast={() => useDesignStore.getState().toggleHighContrastMode()} reducedMotion={false} onToggleReducedMotion={() => {}} screenReaderText="" />
          </div>
        </div>
      )}

      <ExportHistoryPanel open={showExportHistory} onClose={() => setShowExportHistory(false)} history={[]} />

      {showDefaultStyles && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setShowDefaultStyles(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[350px] p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Default Styles</span><button onClick={() => setShowDefaultStyles(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
            <DefaultStylesPanel fillColor="#000000" strokeColor="#000000" strokeWidth={1} fontFamily="Inter" fontSize={16} onFillChange={() => {}} onStrokeChange={() => {}} onStrokeWidthChange={() => {}} onFontChange={() => {}} onFontSizeChange={() => {}} />
          </div>
        </div>
      )}

      {showColorContrast && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[260px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Contrast Checker</span><button onClick={() => setShowColorContrast(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <ColorContrastChecker foreground={objectProps?.fill || '#000000'} background="#ffffff" />
        </div>
      )}

      {showImageFilters && (
        <div className="fixed left-16 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[260px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Image Filters</span><button onClick={() => setShowImageFilters(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <ImageFiltersPanel brightness={imageBrightness} contrast={imageContrast} saturation={imageSaturation} onBrightnessChange={setImageBrightness} onContrastChange={setImageContrast} onSaturationChange={setImageSaturation} onReset={() => { setImageBrightness(0); setImageContrast(0); setImageSaturation(0) }} />
        </div>
      )}

      {showStylePresets && (
        <div className="fixed left-16 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[260px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Style Presets</span><button onClick={() => setShowStylePresets(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <StylePresetsPanel presets={[{id:'minimal',name:'Minimal',fill:'#fff',stroke:'#000',shadow:false},{id:'shadow',name:'Shadow',fill:'#fff',stroke:'#e5e7eb',shadow:true},{id:'dark',name:'Dark',fill:'#1f2937',stroke:'#374151',shadow:false},{id:'accent',name:'Accent',fill:'#3b82f6',stroke:'#2563eb',shadow:true}]} onApply={() => {}} />
        </div>
      )}

      {showDevicePreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setShowDevicePreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-2 border-b"><span className="text-sm font-semibold">Device Preview</span><button onClick={() => setShowDevicePreview(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
            <DevicePreview device={devicePreviewDevice} onDeviceChange={setDevicePreviewDevice}><div className="bg-gray-100 flex items-center justify-center text-gray-400 text-sm p-8">Canvas Preview</div></DevicePreview>
          </div>
        </div>
      )}

      {showAutoLayout && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[260px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Auto Layout</span><button onClick={() => setShowAutoLayout(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <AutoLayoutSettings direction={autoLayoutDir} gap={autoLayoutGap} padding={autoLayoutPadding} onDirectionChange={setAutoLayoutDir} onGapChange={setAutoLayoutGap} onPaddingChange={setAutoLayoutPadding} />
        </div>
      )}

      {showAnimationPanel && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[260px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Animation</span><button onClick={() => setShowAnimationPanel(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <AnimationPanel type={animationType} duration={animationDuration} easing={animationEasing} delay={animationDelay} onTypeChange={setAnimationType} onDurationChange={setAnimationDuration} onEasingChange={setAnimationEasing} onDelayChange={setAnimationDelay} />
        </div>
      )}

      {showHandoffSpecs && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[300px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Handoff Specs</span><button onClick={() => setShowHandoffSpecs(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <HandoffSpecsPanel specs={objectProps ? [{label:'X',value:Math.round(objectProps.left||0)+'px'},{label:'Y',value:Math.round(objectProps.top||0)+'px'},{label:'W',value:Math.round(objectProps.width||0)+'px'},{label:'H',value:Math.round(objectProps.height||0)+'px'},{label:'Fill',value:objectProps.fill||'none'}] : []} onCopy={(v: string) => navigator.clipboard.writeText(v)} />
        </div>
      )}

      {showDesignLint && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[300px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Design Lint</span><button onClick={() => setShowDesignLint(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <DesignLintPanel issues={[]} onFix={() => {}} />
        </div>
      )}

      {showExportPreview && (
        <div className="fixed right-4 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[300px]">
          <div className="flex justify-between items-center px-3 py-2 border-b"><span className="text-xs font-semibold">Export Preview</span><button onClick={() => setShowExportPreview(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <ExportPreviewPanel format={exportFormat} scale={exportScale} quality={exportQuality} previewUrl="" onFormatChange={setExportFormat} onScaleChange={setExportScale} onQualityChange={setExportQuality} />
        </div>
      )}

      {showComponentLibrary && (
        <div className="fixed left-16 top-12 z-[200] bg-white rounded-lg shadow-xl border w-[300px] max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center px-3 py-2 border-b sticky top-0 bg-white"><span className="text-xs font-semibold">Component Library</span><button onClick={() => setShowComponentLibrary(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <ComponentLibrary components={[{id:'btn',name:'Button',category:'Forms'},{id:'input',name:'Input',category:'Forms'},{id:'card',name:'Card',category:'Layout'},{id:'nav',name:'Nav Bar',category:'Navigation'}]} onInsert={(id: string) => runEngine('add' + id.charAt(0).toUpperCase() + id.slice(1))} searchQuery={componentSearch} onSearchChange={setComponentSearch} />
        </div>
      )}

      <ConfirmDialog open={showConfirmDialog} title="Confirm Action" message={confirmMsg} onConfirm={() => { confirmAction?.(); setShowConfirmDialog(false) }} onCancel={() => setShowConfirmDialog(false)} />
    </>
  )
}

function MenuBtn({ label, shortcut, onClick }: { label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-canvas-text hover:bg-canvas-hover transition-colors">
      <span>{label}</span>
      {shortcut && <span className="text-canvas-text-tertiary text-[10px]">{shortcut}</span>}
    </button>
  )
}
