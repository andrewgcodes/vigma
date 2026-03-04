"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Strikethrough,
  FlipHorizontal, FlipVertical,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown,
  Lock, Unlock,
  Download, Crop, Sparkles, Plus, Minus, Eye, EyeOff,
  Code, Settings, MoreHorizontal, Grid3X3,
  AlignVerticalJustifyStart, AlignVerticalJustifyEnd,
  AlignVerticalJustifyCenter,
  Rows3, Columns3, LayoutGrid, Link, Unlink
} from "lucide-react"
import ColorPicker from "./ColorPicker"

interface PropertiesPanelProps {
  objectProps: Record<string, any> | null
  onPropertyChange: (prop: string, value: any) => void
  onFillChange: (color: string) => void
  onStrokeChange: (color: string, width?: number) => void
  onOpacityChange: (opacity: number) => void
  onCornerRadiusChange: (radius: number) => void
  onShadowChange: (config: { color: string, blur: number, offsetX: number, offsetY: number }) => void
  onShadowRemove: () => void
  onDelete: () => void
  onDuplicate: () => void
  onFlipH: () => void
  onFlipV: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onPositionChange: (x: number, y: number) => void
  onSizeChange: (w: number, h: number) => void
  onRotationChange: (angle: number) => void
  onTextPropertyChange: (prop: string, value: any) => void
  onLock: (lock: boolean) => void
  onGradientChange: (config: any) => void
  onStrokeDashChange: (dash: number[]) => void
  onAlignObjects: (align: string) => void
  onDistribute: (dir: "horizontal" | "vertical") => void
  onBlendModeChange?: (mode: string) => void
  onStrokePositionChange?: (position: "center" | "inside" | "outside") => void
  onIndividualCornerChange?: (corners: { tl: number, tr: number, br: number, bl: number }) => void
  onBlurChange?: (blur: number) => void
  onInnerShadowChange?: (config: { color: string, blur: number, offsetX: number, offsetY: number }) => void
  onExportSelected?: (format: string, scale: number) => void
  onCropImage?: (crop: { left: number, top: number, width: number, height: number }) => void
  onResetCrop?: () => void
  onFlatten?: () => void
  onStrokeLineCapChange?: (cap: CanvasLineCap) => void
  onStrokeLineJoinChange?: (join: CanvasLineJoin) => void
  onAutoLayout?: (direction: 'horizontal' | 'vertical' | 'wrap' | 'grid', gap?: number) => void
  onGenerateCode?: (format: 'css' | 'svg' | 'react') => string
}

const BLEND_MODES = [
  "source-over", "multiply", "screen", "overlay", "darken", "lighten",
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference",
  "exclusion", "hue", "saturation", "color", "luminosity"
]

const BLEND_MODE_LABELS: Record<string, string> = {
  "source-over": "Normal", "multiply": "Multiply", "screen": "Screen",
  "overlay": "Overlay", "darken": "Darken", "lighten": "Lighten",
  "color-dodge": "Color Dodge", "color-burn": "Color Burn",
  "hard-light": "Hard Light", "soft-light": "Soft Light",
  "difference": "Difference", "exclusion": "Exclusion",
  "hue": "Hue", "saturation": "Saturation", "color": "Color", "luminosity": "Luminosity",
}

export default function PropertiesPanel({
  objectProps,
  onPropertyChange,
  onFillChange,
  onStrokeChange,
  onOpacityChange,
  onCornerRadiusChange,
  onShadowChange,
  onShadowRemove,
  onDelete,
  onDuplicate,
  onFlipH,
  onFlipV,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onPositionChange,
  onSizeChange,
  onRotationChange,
  onTextPropertyChange,
  onLock,
  onGradientChange,
  onStrokeDashChange,
  onAlignObjects,
  onDistribute,
  onBlendModeChange,
  onStrokePositionChange,
  onIndividualCornerChange,
  onBlurChange,
  onInnerShadowChange,
  onExportSelected,
  onCropImage,
  onResetCrop,
  onFlatten,
  onStrokeLineCapChange,
  onStrokeLineJoinChange,
  onAutoLayout,
  onGenerateCode,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"design" | "prototype">("design")
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowConfig, setShadowConfig] = useState({ color: "rgba(0,0,0,0.25)", blur: 10, offsetX: 0, offsetY: 4 })
  const [fillType, setFillType] = useState<"solid" | "gradient" | "none">("solid")
  const [lastSolidColor, setLastSolidColor] = useState("#4A90D9")
  const [gradientColor1, setGradientColor1] = useState("#4A90D9")
  const [gradientColor2, setGradientColor2] = useState("#50C878")
  const [showIndividualCorners, setShowIndividualCorners] = useState(false)
  const [individualCorners, setIndividualCorners] = useState({ tl: 0, tr: 0, br: 0, bl: 0 })
  const [innerShadowEnabled, setInnerShadowEnabled] = useState(false)
  const [innerShadowConfig, setInnerShadowConfig] = useState({ color: "rgba(0,0,0,0.25)", blur: 10, offsetX: 0, offsetY: 4 })
  const [fillVisible, setFillVisible] = useState(true)
  const [strokeVisible, setStrokeVisible] = useState(true)
  const [showInExports, setShowInExports] = useState(true)
  const [clipContent, setClipContent] = useState(false)
  const [fillOpacity, setFillOpacity] = useState(100)
  const [strokeOpacity, setStrokeOpacity] = useState(100)
  const [fillHexInput, setFillHexInput] = useState('')
  const [strokeHexInput, setStrokeHexInput] = useState('')
  const [isFillHexFocused, setIsFillHexFocused] = useState(false)
  const [isStrokeHexFocused, setIsStrokeHexFocused] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)
  const [hasFill, setHasFill] = useState(true)
  const [effects, setEffects] = useState<Array<{ type: string, enabled: boolean }>>([])
  const [exportPresets, setExportPresets] = useState<Array<{ scale: number, format: string }>>([])
  const [layoutGuides, setLayoutGuides] = useState<Array<{ type: string, size: number, visible: boolean }>>([])
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false)
  const [savedFillColor, setSavedFillColor] = useState("#4A90D9")
  const [savedStrokeWidth, setSavedStrokeWidth] = useState(1)
  const [comingSoonToast, setComingSoonToast] = useState("")
  const [codeExportOpen, setCodeExportOpen] = useState(false)
  const [codeExportFormat, setCodeExportFormat] = useState<'css' | 'svg' | 'react'>('css')
  const [codeExportContent, setCodeExportContent] = useState('')
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [textResizeMode, setTextResizeMode] = useState<'fixed' | 'auto-width' | 'auto-height'>('auto-height')
  const [verticalTextAlign, setVerticalTextAlign] = useState<'top' | 'middle' | 'bottom'>('top')
  const [typographySettingsOpen, setTypographySettingsOpen] = useState(false)

  // Show a brief "coming soon" toast
  const showComingSoon = useCallback((feature: string) => {
    setComingSoonToast(feature + " coming soon")
    setTimeout(() => setComingSoonToast(""), 2000)
  }, [])

  // Sync shadow state with selected object
  useEffect(() => {
    if (objectProps?.shadow) {
      setShadowEnabled(true)
      const s = objectProps.shadow
      if (s && typeof s === "object") {
        setShadowConfig({
          color: s.color || "rgba(0,0,0,0.25)",
          blur: s.blur ?? 10,
          offsetX: s.offsetX ?? 0,
          offsetY: s.offsetY ?? 4,
        })
      }
    } else {
      setShadowEnabled(false)
    }
  }, [objectProps?.shadow, objectProps?.id])

  // Sync fill type with selected object
  useEffect(() => {
    if (objectProps?.fill && typeof objectProps.fill === "object" && objectProps.fill.type) {
      setFillType("gradient")
      setHasFill(true)
      const stops = objectProps.fill.colorStops
      if (stops && stops.length >= 2) {
        setGradientColor1(stops[0].color || "#4A90D9")
        setGradientColor2(stops[stops.length - 1].color || "#50C878")
      }
    } else if (objectProps?.fill === "transparent" || objectProps?.fill === "" || objectProps?.fill === null) {
      setFillType("none")
      setHasFill(false)
    } else {
      setFillType("solid")
      setHasFill(true)
      if (typeof objectProps?.fill === "string" && objectProps.fill !== "transparent") {
        setLastSolidColor(objectProps.fill)
        setSavedFillColor(objectProps.fill)
      }
    }
  }, [objectProps?.fill, objectProps?.id])

  // Sync fill visibility
  useEffect(() => {
    if (objectProps?.fill && objectProps.fill !== "transparent") {
      setFillVisible(true)
    }
  }, [objectProps?.fill, objectProps?.id])

  // Sync inner shadow
  useEffect(() => {
    if (objectProps?.innerShadow) {
      setInnerShadowEnabled(true)
      setInnerShadowConfig(objectProps.innerShadow)
    } else {
      setInnerShadowEnabled(false)
    }
  }, [objectProps?.innerShadow, objectProps?.id])

  // Sync individual corners
  useEffect(() => {
    if (objectProps?.cornerRadii) {
      setShowIndividualCorners(true)
      setIndividualCorners(objectProps.cornerRadii)
    } else {
      setShowIndividualCorners(false)
    }
  }, [objectProps?.cornerRadii, objectProps?.id])

  // Sync stroke
  useEffect(() => {
    const sw = objectProps?.strokeWidth ?? 0
    setHasStroke(sw > 0)
    if (sw > 0) {
      setSavedStrokeWidth(sw)
      setStrokeVisible(true)
    }
  }, [objectProps?.strokeWidth, objectProps?.id])

  // Sync fill/stroke opacity from objectProps on selection change
  useEffect(() => {
    if (objectProps?.opacity !== undefined) {
      setFillOpacity(Math.round((objectProps.opacity ?? 1) * 100))
    }
  }, [objectProps?.opacity, objectProps?.id])

  useEffect(() => {
    if (objectProps?.strokeOpacity !== undefined) {
      setStrokeOpacity(Math.round((objectProps.strokeOpacity ?? 1) * 100))
    }
  }, [objectProps?.strokeOpacity, objectProps?.id])

  // Sync effects from shadow/inner shadow
  useEffect(() => {
    const effs: Array<{ type: string, enabled: boolean }> = []
    // Always include effects that have been added, even when disabled
    if (shadowEnabled || objectProps?.shadow) {
      effs.push({ type: "Drop shadow", enabled: shadowEnabled })
    }
    if (innerShadowEnabled || objectProps?.innerShadow) {
      effs.push({ type: "Inner shadow", enabled: innerShadowEnabled })
    }
    if (objectProps?.blurAmount && objectProps.blurAmount > 0) {
      effs.push({ type: "Layer blur", enabled: true })
    }
    setEffects(effs)
  }, [shadowEnabled, innerShadowEnabled, objectProps?.blurAmount, objectProps?.shadow, objectProps?.innerShadow, objectProps?.id])

  // Handle fill visibility toggle - actually affects canvas
  const handleToggleFillVisible = useCallback(() => {
    if (fillVisible) {
      // Hide fill: save current color and set transparent
      const currentFill = typeof objectProps?.fill === "string" ? objectProps.fill : savedFillColor
      if (currentFill && currentFill !== "transparent") {
        setSavedFillColor(currentFill)
      }
      setFillVisible(false)
      onFillChange("transparent")
    } else {
      // Show fill: restore saved color
      setFillVisible(true)
      onFillChange(savedFillColor)
    }
  }, [fillVisible, objectProps?.fill, savedFillColor, onFillChange])

  // Handle stroke visibility toggle - actually affects canvas
  const handleToggleStrokeVisible = useCallback(() => {
    if (strokeVisible) {
      // Hide stroke: save current width and set to 0
      const currentWidth = objectProps?.strokeWidth ?? savedStrokeWidth
      if (currentWidth > 0) {
        setSavedStrokeWidth(currentWidth)
      }
      setStrokeVisible(false)
      onStrokeChange(objectProps?.stroke || "#000000", 0)
    } else {
      // Show stroke: restore saved width
      setStrokeVisible(true)
      onStrokeChange(objectProps?.stroke || "#000000", savedStrokeWidth || 1)
    }
  }, [strokeVisible, objectProps?.strokeWidth, objectProps?.stroke, savedStrokeWidth, onStrokeChange])

  // Handle constrained resize
  const handleConstrainedWidth = useCallback((newW: number) => {
    if (aspectRatioLocked && objectProps?.width && objectProps?.height) {
      const ratio = objectProps.height / objectProps.width
      onSizeChange(newW, Math.round(newW * ratio))
    } else {
      onSizeChange(newW, objectProps?.height ?? 100)
    }
  }, [aspectRatioLocked, objectProps?.width, objectProps?.height, onSizeChange])

  const handleConstrainedHeight = useCallback((newH: number) => {
    if (aspectRatioLocked && objectProps?.width && objectProps?.height) {
      const ratio = objectProps.width / objectProps.height
      onSizeChange(Math.round(newH * ratio), newH)
    } else {
      onSizeChange(objectProps?.width ?? 100, newH)
    }
  }, [aspectRatioLocked, objectProps?.width, objectProps?.height, onSizeChange])

  // Handle object visibility toggle
  const handleToggleObjectVisible = useCallback(() => {
    const currentlyVisible = objectProps?.visible !== false
    onPropertyChange("visible", !currentlyVisible)
  }, [objectProps?.visible, onPropertyChange])

  // Handle clip content toggle
  const handleToggleClipContent = useCallback((checked: boolean) => {
    setClipContent(checked)
    onPropertyChange("_clipContent", checked)
  }, [onPropertyChange])

  if (!objectProps) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center border-b border-canvas-border">
          <button className="flex-1 px-4 py-2.5 text-xs font-medium text-canvas-accent relative" title="Design properties">
            Design
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-canvas-accent rounded-full" />
          </button>
          <button className="flex-1 px-4 py-2.5 text-xs font-medium text-canvas-text-secondary hover:text-canvas-text" title="Prototype interactions (coming soon)">
            Prototype
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-canvas-text-tertiary">Select an object</span>
        </div>
      </div>
    )
  }

  const isText = objectProps.type === "textbox" || objectProps.type === "i-text"
  const isRect = objectProps.type === "rect" || objectProps.isRect
  const isFrame = objectProps.isFrame
  const isImage = objectProps.isImage
  const fillColor = typeof objectProps.fill === "string" ? objectProps.fill : "#4A90D9"
  const objectType = isFrame ? "Frame" : isText ? "Text" : isImage ? "Image" : objectProps.name || objectProps.type || "Object"
  const displayFillColor = fillColor.replace("#", "").toUpperCase()
  const isObjectVisible = objectProps.visible !== false

  return (
    <div className="flex flex-col h-full overflow-y-auto text-canvas-text">
      {/* Coming soon toast */}
      {comingSoonToast && (
        <div className="fixed top-16 right-8 z-[100] bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg animate-fade-in">
          {comingSoonToast}
        </div>
      )}

      {/* Design / Prototype tabs */}
      <div className="flex items-center border-b border-canvas-border flex-shrink-0">
        <button
          onClick={() => setActiveTab("design")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium relative transition-colors ${activeTab === "design" ? "text-canvas-accent" : "text-canvas-text-secondary hover:text-canvas-text"}`}
          title="Design properties"
        >
          Design
          {activeTab === "design" && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-canvas-accent rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab("prototype")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium relative transition-colors ${activeTab === "prototype" ? "text-canvas-accent" : "text-canvas-text-secondary hover:text-canvas-text"}`}
          title="Prototype interactions (coming soon)"
        >
          Prototype
          {activeTab === "prototype" && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-canvas-accent rounded-full" />}
        </button>
      </div>

      {activeTab === "prototype" ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-canvas-text-tertiary text-center">Prototype interactions coming soon</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Object type header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-canvas-border">
            <span className="text-sm font-medium text-canvas-text">{objectType}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => {
                const code = onGenerateCode?.(codeExportFormat) || '// No object selected'
                setCodeExportContent(code)
                setCodeExportOpen(!codeExportOpen)
              }} className={`p-1 rounded hover:bg-canvas-hover ${codeExportOpen ? 'text-canvas-accent' : 'text-canvas-text-secondary'}`} title="Export as code (CSS, SVG, or React)">
                <Code size={14} />
              </button>
              <button onClick={onDuplicate} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Duplicate this object">
                <Settings size={14} />
              </button>
              <div className="relative">
                <button onClick={() => setMoreMenuOpen(!moreMenuOpen)} className={`p-1 rounded hover:bg-canvas-hover ${moreMenuOpen ? 'text-canvas-accent' : 'text-canvas-text-secondary'}`} title="More options">
                  <MoreHorizontal size={14} />
                </button>
                {moreMenuOpen && (
                  <div className="absolute right-0 top-8 w-40 bg-white border border-canvas-border rounded-lg shadow-lg z-50 py-1">
                    <button onClick={() => { onDuplicate(); setMoreMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas-hover text-canvas-text">Duplicate</button>
                    <button onClick={() => { onFlipH(); setMoreMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas-hover text-canvas-text">Flip horizontal</button>
                    <button onClick={() => { onFlipV(); setMoreMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas-hover text-canvas-text">Flip vertical</button>
                    <button onClick={() => { onLock(!objectProps.locked); setMoreMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas-hover text-canvas-text">{objectProps.locked ? 'Unlock' : 'Lock'}</button>
                    <hr className="my-1 border-canvas-border" />
                    <button onClick={() => { onDelete(); setMoreMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas-hover text-red-500">Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code export panel */}
          {codeExportOpen && (
            <div className="px-4 py-3 border-b border-canvas-border bg-canvas-bg/50">
              <div className="flex items-center gap-1 mb-2">
                <button onClick={() => { setCodeExportFormat('css'); setCodeExportContent(onGenerateCode?.('css') || '') }} className={`flex-1 text-xxs py-1 rounded-md border ${codeExportFormat === 'css' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`} title="CSS code">CSS</button>
                <button onClick={() => { setCodeExportFormat('svg'); setCodeExportContent(onGenerateCode?.('svg') || '') }} className={`flex-1 text-xxs py-1 rounded-md border ${codeExportFormat === 'svg' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`} title="SVG markup">SVG</button>
                <button onClick={() => { setCodeExportFormat('react'); setCodeExportContent(onGenerateCode?.('react') || '') }} className={`flex-1 text-xxs py-1 rounded-md border ${codeExportFormat === 'react' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`} title="React JSX code">React</button>
              </div>
              <pre className="text-[10px] bg-gray-900 text-green-400 p-2 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap font-mono">{codeExportContent}</pre>
              <button onClick={() => { navigator.clipboard.writeText(codeExportContent); setComingSoonToast('Copied to clipboard!'); setTimeout(() => setComingSoonToast(''), 1500) }} className="mt-1.5 w-full text-xxs py-1.5 rounded-md border border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover" title="Copy code to clipboard">Copy to clipboard</button>
            </div>
          )}

          {/* ===== POSITION SECTION ===== */}
          <Section title="Position">
            <div className="mb-3">
              <span className="text-xxs text-canvas-text-tertiary mb-1 block">Alignment</span>
              <div className="flex items-center gap-0.5">
                <div className="flex items-center gap-0.5 pr-2 border-r border-canvas-border">
                  <AlignBtn icon={<AlignStartVertical size={14} />} onClick={() => onAlignObjects("left")} title="Align left edges" />
                  <AlignBtn icon={<AlignCenterVertical size={14} />} onClick={() => onAlignObjects("center")} title="Align horizontal centers" />
                  <AlignBtn icon={<AlignEndVertical size={14} />} onClick={() => onAlignObjects("right")} title="Align right edges" />
                </div>
                <div className="flex items-center gap-0.5 pl-1">
                  <AlignBtn icon={<AlignStartHorizontal size={14} />} onClick={() => onAlignObjects("top")} title="Align top edges" />
                  <AlignBtn icon={<AlignCenterHorizontal size={14} />} onClick={() => onAlignObjects("middle")} title="Align vertical centers" />
                  <AlignBtn icon={<AlignEndHorizontal size={14} />} onClick={() => onAlignObjects("bottom")} title="Align bottom edges" />
                </div>
                <div className="ml-auto flex gap-0.5">
                  <button onClick={() => onDistribute("horizontal")} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Distribute horizontal spacing evenly">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="7" x2="13" y2="7" /><line x1="3" y1="3" x2="3" y2="11" /><line x1="11" y1="3" x2="11" y2="11" /></svg>
                  </button>
                  <button onClick={() => onDistribute("vertical")} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Distribute vertical spacing evenly">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="7" y1="1" x2="7" y2="13" /><line x1="3" y1="3" x2="11" y2="3" /><line x1="3" y1="11" x2="11" y2="11" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <div className="grid grid-cols-2 gap-2">
                <PropInput label="X" value={objectProps.left} onChange={(v) => onPositionChange(v, objectProps.top)} title="Horizontal position" />
                <PropInput label="Y" value={objectProps.top} onChange={(v) => onPositionChange(objectProps.left, v)} title="Vertical position" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <PropInput label={"↺"} value={objectProps.angle} onChange={(v) => onRotationChange(v)} title="Rotation angle in degrees" />
              </div>
              <button onClick={onFlipH} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Flip horizontally"><FlipHorizontal size={14} /></button>
              <button onClick={onFlipV} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Flip vertically"><FlipVertical size={14} /></button>
              <button onClick={() => onLock(!objectProps.locked)} className={`p-1.5 rounded hover:bg-canvas-hover ${objectProps.locked ? "text-orange-500" : "text-canvas-text-secondary"}`} title={objectProps.locked ? "Unlock object position and size" : "Lock object position and size"}>
                {objectProps.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
          </Section>

          {/* ===== LAYOUT SECTION ===== */}
          <Section title="Layout">
            {(isFrame || isRect) && (
              <div className="mb-3">
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Auto layout</span>
                <div className="flex items-center gap-0.5">
                  <FlowBtn icon={<LayoutGrid size={14} />} active={false} onClick={() => onAutoLayout?.('wrap')} title="Wrap auto layout - arrange children in wrapping rows" />
                  <FlowBtn icon={<Columns3 size={14} />} active={false} onClick={() => onAutoLayout?.('vertical')} title="Vertical auto layout - stack children vertically" />
                  <FlowBtn icon={<Rows3 size={14} />} active={false} onClick={() => onAutoLayout?.('horizontal')} title="Horizontal auto layout - arrange children horizontally" />
                  <FlowBtn icon={<Grid3X3 size={14} />} active={false} onClick={() => onAutoLayout?.('grid')} title="Grid layout - arrange children in a grid" />
                </div>
              </div>
            )}
            {isText && (
              <div className="mb-3">
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Text resizing</span>
                <div className="flex items-center bg-canvas-bg rounded-lg border border-canvas-border p-0.5">
                  <button onClick={() => { setTextResizeMode('fixed'); onTextPropertyChange('splitByGrapheme', false) }} className={`flex-1 p-1.5 rounded text-center ${textResizeMode === 'fixed' ? 'bg-canvas-hover text-canvas-text' : 'text-canvas-text-secondary hover:bg-canvas-hover'}`} title="Fixed size - text box stays the same size">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto"><line x1="3" y1="4" x2="3" y2="10" /><line x1="3" y1="7" x2="11" y2="7" /><polyline points="8,5 11,7 8,9" /></svg>
                  </button>
                  <button onClick={() => { setTextResizeMode('auto-width'); onTextPropertyChange('splitByGrapheme', true) }} className={`flex-1 p-1.5 rounded text-center ${textResizeMode === 'auto-width' ? 'bg-canvas-hover text-canvas-text' : 'text-canvas-text-secondary hover:bg-canvas-hover'}`} title="Auto width - width adjusts to fit text">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto"><line x1="3" y1="4" x2="3" y2="10" /><line x1="7" y1="4" x2="7" y2="10" /><line x1="11" y1="4" x2="11" y2="10" /></svg>
                  </button>
                  <button onClick={() => { setTextResizeMode('auto-height'); onTextPropertyChange('splitByGrapheme', false) }} className={`flex-1 p-1.5 rounded text-center ${textResizeMode === 'auto-height' ? 'bg-canvas-hover text-canvas-text' : 'text-canvas-text-secondary hover:bg-canvas-hover'}`} title="Auto height - height adjusts to fit text">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto"><rect x="2" y="3" width="10" height="8" rx="1" /></svg>
                  </button>
                </div>
              </div>
            )}
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <div className="flex-1"><PropInput label="W" value={objectProps.width} onChange={handleConstrainedWidth} title="Width" /></div>
                <div className="flex-1"><PropInput label="H" value={objectProps.height} onChange={handleConstrainedHeight} title="Height" /></div>
                <button
                  onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                  className={`p-1.5 rounded hover:bg-canvas-hover ${aspectRatioLocked ? "text-canvas-accent" : "text-canvas-text-secondary"}`}
                  title={aspectRatioLocked ? "Unlock aspect ratio" : "Lock aspect ratio - constrain proportions"}
                >
                  {aspectRatioLocked ? <Link size={14} /> : <Unlink size={14} />}
                </button>
              </div>
            </div>
            {(isFrame || isRect) && (
              <label className="flex items-center gap-2 cursor-pointer mt-1" title="Clip content that extends beyond the frame bounds">
                <input type="checkbox" checked={clipContent} onChange={(e) => handleToggleClipContent(e.target.checked)} className="w-3.5 h-3.5 rounded accent-canvas-accent" />
                <span className="text-xs text-canvas-text-secondary">Clip content</span>
              </label>
            )}
          </Section>

          {/* ===== APPEARANCE SECTION ===== */}
          <Section title="Appearance" headerRight={
            <button onClick={handleToggleObjectVisible} className={`p-0.5 rounded hover:bg-canvas-hover ${isObjectVisible ? "text-canvas-text-secondary" : "text-orange-500"}`} title={isObjectVisible ? "Hide object on canvas" : "Show object on canvas"}>
              {isObjectVisible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          }>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Opacity</span>
                <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Object opacity and blend mode">
                  <select value={objectProps.blendMode || "source-over"} onChange={(e) => onBlendModeChange?.(e.target.value)} className="text-xs bg-transparent border-none focus:outline-none text-canvas-text-secondary w-5 appearance-none cursor-pointer" title="Blend mode - controls how this layer blends with layers below">
                    {BLEND_MODES.map(mode => (<option key={mode} value={mode}>{BLEND_MODE_LABELS[mode] || mode}</option>))}
                  </select>
                  <input type="number" value={Math.round((objectProps.opacity ?? 1) * 100)} onChange={(e) => onOpacityChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)} min={0} max={100} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text text-right" title="Opacity percentage (0-100%)" />
                  <span className="text-xs text-canvas-text-tertiary">%</span>
                </div>
              </div>
              <div>
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Corner radius</span>
                {isRect || isFrame ? (
                  <div className="flex items-center gap-1">
                    <div className="flex-1 flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Corner radius in pixels">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M1 8V4C1 2.34 2.34 1 4 1H8" /></svg>
                      <input type="number" value={objectProps.rx || 0} onChange={(e) => onCornerRadiusChange(parseFloat(e.target.value) || 0)} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Uniform corner radius" />
                    </div>
                    <button onClick={() => setShowIndividualCorners(!showIndividualCorners)} className={`p-1 rounded hover:bg-canvas-hover flex-shrink-0 ${showIndividualCorners ? "text-canvas-accent" : "text-canvas-text-tertiary"}`} title={showIndividualCorners ? "Switch to uniform corner radius" : "Set individual corner radii"}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5V3C1 1.9 1.9 1 3 1H5M9 1H11C12.1 1 13 1.9 13 3V5M13 9V11C12.1 13 12.1 13 11 13H9M5 13H3C1.9 13 1 12.1 1 11V9" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Corner radius not available for this shape">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M1 8V4C1 2.34 2.34 1 4 1H8" /></svg>
                    <span className="text-xs text-canvas-text-tertiary">--</span>
                  </div>
                )}
              </div>
            </div>
            {showIndividualCorners && (isRect || isFrame) && (
              <div className="mb-2">
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Top-left corner radius">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.tl} onChange={(e) => { const c = { ...individualCorners, tl: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Top-left radius" />
                  </div>
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Top-right corner radius">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0 -scale-x-100"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.tr} onChange={(e) => { const c = { ...individualCorners, tr: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Top-right radius" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Bottom-left corner radius">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0 -scale-y-100"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.bl} onChange={(e) => { const c = { ...individualCorners, bl: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Bottom-left radius" />
                  </div>
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Bottom-right corner radius">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0 scale-x-[-1] scale-y-[-1]"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.br} onChange={(e) => { const c = { ...individualCorners, br: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Bottom-right radius" />
                  </div>
                </div>
                <button onClick={() => { setShowIndividualCorners(false); const avg = Math.round((individualCorners.tl + individualCorners.tr + individualCorners.br + individualCorners.bl) / 4); onCornerRadiusChange(avg) }} className="text-xxs text-canvas-accent hover:underline" title="Reset to a single uniform radius value">Uniform radius</button>
              </div>
            )}
          </Section>

          {/* ===== TYPOGRAPHY (Text only) ===== */}
          {isText && (
            <Section title="Typography" headerRight={
              <button onClick={() => setTypographySettingsOpen(!typographySettingsOpen)} className={`p-0.5 rounded hover:bg-canvas-hover ${typographySettingsOpen ? 'text-canvas-accent' : 'text-canvas-text-secondary'}`} title="Toggle advanced typography settings"><Settings size={13} /></button>
            }>
              <div className="space-y-2">
                <select value={objectProps.fontFamily || "Inter"} onChange={(e) => onTextPropertyChange("fontFamily", e.target.value)} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent" title="Font family">
                  {["Inter", "Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New", "Verdana", "Trebuchet MS", "Palatino", "Garamond", "Comic Sans MS", "Impact", "Lucida Console", "Tahoma"].map(f => (<option key={f} value={f}>{f}</option>))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select value={objectProps.fontWeight || "normal"} onChange={(e) => onTextPropertyChange("fontWeight", e.target.value)} className="text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent" title="Font weight">
                    <option value="normal">Regular</option>
                    <option value="100">Thin</option>
                    <option value="200">Extra Light</option>
                    <option value="300">Light</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="bold">Bold</option>
                    <option value="800">Extra Bold</option>
                    <option value="900">Black</option>
                  </select>
                  <PropInput label="" value={objectProps.fontSize || 20} onChange={(v) => onTextPropertyChange("fontSize", v)} min={1} title="Font size in pixels" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Line height</span>
                    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Line height multiplier">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M2 2h8M2 6h8M2 10h8" /></svg>
                      <input type="number" value={objectProps.lineHeight || 1.2} onChange={(e) => onTextPropertyChange("lineHeight", parseFloat(e.target.value) || 1.2)} step={0.1} min={0.5} max={5} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Line height" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Letter spacing</span>
                    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Letter spacing in pixels">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M3 2L6 10M9 2L6 10" /></svg>
                      <input type="number" value={objectProps.charSpacing || 0} onChange={(e) => onTextPropertyChange("charSpacing", parseFloat(e.target.value) || 0)} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Letter spacing" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xxs text-canvas-text-tertiary mb-1 block">Alignment</span>
                  <div className="flex items-center gap-0.5">
                    <div className="flex items-center gap-0.5 pr-2 border-r border-canvas-border">
                      <TextStyleBtn icon={<AlignLeft size={14} />} active={objectProps.textAlign === "left"} onClick={() => onTextPropertyChange("textAlign", "left")} title="Align text left" />
                      <TextStyleBtn icon={<AlignCenter size={14} />} active={objectProps.textAlign === "center"} onClick={() => onTextPropertyChange("textAlign", "center")} title="Align text center" />
                      <TextStyleBtn icon={<AlignRight size={14} />} active={objectProps.textAlign === "right"} onClick={() => onTextPropertyChange("textAlign", "right")} title="Align text right" />
                    </div>
                    <div className="flex items-center gap-0.5 pl-1">
                      <TextStyleBtn icon={<AlignVerticalJustifyStart size={14} />} active={verticalTextAlign === 'top'} onClick={() => { setVerticalTextAlign('top'); onPropertyChange('verticalAlign', 'top') }} title="Align text to top" />
                      <TextStyleBtn icon={<AlignVerticalJustifyCenter size={14} />} active={verticalTextAlign === 'middle'} onClick={() => { setVerticalTextAlign('middle'); onPropertyChange('verticalAlign', 'middle') }} title="Align text to middle" />
                      <TextStyleBtn icon={<AlignVerticalJustifyEnd size={14} />} active={verticalTextAlign === 'bottom'} onClick={() => { setVerticalTextAlign('bottom'); onPropertyChange('verticalAlign', 'bottom') }} title="Align text to bottom" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <TextStyleBtn icon={<Bold size={14} />} active={objectProps.fontWeight === "bold" || objectProps.fontWeight === "700"} onClick={() => onTextPropertyChange("fontWeight", objectProps.fontWeight === "bold" ? "normal" : "bold")} title="Bold (Ctrl+B)" />
                  <TextStyleBtn icon={<Italic size={14} />} active={objectProps.fontStyle === "italic"} onClick={() => onTextPropertyChange("fontStyle", objectProps.fontStyle === "italic" ? "normal" : "italic")} title="Italic (Ctrl+I)" />
                  <TextStyleBtn icon={<Underline size={14} />} active={objectProps.underline} onClick={() => onTextPropertyChange("underline", !objectProps.underline)} title="Underline (Ctrl+U)" />
                  <TextStyleBtn icon={<Strikethrough size={14} />} active={objectProps.linethrough} onClick={() => onTextPropertyChange("linethrough", !objectProps.linethrough)} title="Strikethrough" />
                </div>
                {typographySettingsOpen && (
                  <div className="space-y-2 pt-2 border-t border-canvas-border">
                    <span className="text-xxs text-canvas-text-tertiary block">Advanced settings</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Paragraph spacing</span>
                        <input type="number" value={objectProps.paragraphSpacing || 0} onChange={(e) => onTextPropertyChange('paragraphSpacing', parseFloat(e.target.value) || 0)} min={0} step={1} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Space between paragraphs" />
                      </div>
                      <div>
                        <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Text transform</span>
                        <select onChange={(e) => {
                          const text = objectProps.text || ''
                          const val = e.target.value
                          if (val === 'uppercase') onTextPropertyChange('text', text.toUpperCase())
                          else if (val === 'lowercase') onTextPropertyChange('text', text.toLowerCase())
                          else if (val === 'capitalize') onTextPropertyChange('text', text.replace(/\b\w/g, (c: string) => c.toUpperCase()))
                        }} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Transform text case">
                          <option value="none">None</option>
                          <option value="uppercase">UPPERCASE</option>
                          <option value="lowercase">lowercase</option>
                          <option value="capitalize">Capitalize</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Overline</span>
                      <button onClick={() => onTextPropertyChange('overline', !objectProps.overline)} className={`text-xxs py-1 px-3 rounded-md border ${objectProps.overline ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`} title="Toggle overline decoration">{objectProps.overline ? 'On' : 'Off'}</button>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ===== FILL SECTION ===== */}
          <Section title="Fill" headerRight={
            <button onClick={() => { if (!hasFill) { setHasFill(true); setFillType("solid"); setFillVisible(true); onFillChange(lastSolidColor) } }} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add a fill color"><Plus size={13} /></button>
          }>
            {hasFill && fillType !== "none" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md border border-canvas-border shadow-sm flex-shrink-0 cursor-pointer" style={{ backgroundColor: fillVisible ? fillColor : "transparent", backgroundImage: !fillVisible ? "repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px" : "none" }} title={`Fill color: ${fillColor}`} />
                  <div className="flex-1 flex items-center bg-canvas-bg border border-canvas-border rounded-lg overflow-hidden" title="Fill color hex value">
                    <input type="text" value={isFillHexFocused ? fillHexInput : displayFillColor} onFocus={() => { setFillHexInput(displayFillColor); setIsFillHexFocused(true) }} onBlur={() => { setIsFillHexFocused(false); const hex = fillHexInput.replace("#", ""); if (/^[0-9A-Fa-f]{6}$/.test(hex)) { onFillChange("#" + hex) } }} onChange={(e) => { const hex = e.target.value.replace("#", ""); setFillHexInput(hex); if (/^[0-9A-Fa-f]{6}$/.test(hex)) { onFillChange("#" + hex) } }} className="flex-1 text-xs bg-transparent px-2 py-1 focus:outline-none text-canvas-text font-mono min-w-0" title="Enter hex color code" />
                    <div className="flex items-center border-l border-canvas-border px-1.5 py-1" title="Fill opacity percentage">
                      <input type="number" value={fillOpacity} onChange={(e) => { const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)); setFillOpacity(v); onOpacityChange(v / 100) }} min={0} max={100} className="w-8 text-xs bg-transparent border-none focus:outline-none text-canvas-text text-right" title="Fill opacity (0-100%)" />
                      <span className="text-xs text-canvas-text-tertiary ml-0.5">%</span>
                    </div>
                  </div>
                  <button onClick={handleToggleFillVisible} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={fillVisible ? "Hide fill - temporarily make fill invisible" : "Show fill - restore fill visibility"}>
                    {fillVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => { setHasFill(false); setFillType("none"); onFillChange("transparent") }} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove fill entirely"><Minus size={13} /></button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setFillType("solid"); onFillChange((fillType === "gradient" || fillColor === "transparent") ? lastSolidColor : fillColor) }} className={`flex-1 text-xxs py-1 rounded-md border ${fillType === "solid" ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`} title="Use a solid fill color">Solid</button>
                  <button onClick={() => { setFillType("gradient"); onGradientChange({ type: "linear", colorStops: { "0": gradientColor1, "1": gradientColor2 } }) }} className={`flex-1 text-xxs py-1 rounded-md border ${fillType === "gradient" ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`} title="Use a gradient fill">Gradient</button>
                </div>
                {fillType === "solid" && (<ColorPicker color={fillColor} onChange={onFillChange} />)}
                {fillType === "gradient" && (
                  <div className="space-y-2">
                    <ColorPicker color={gradientColor1} onChange={(c) => { setGradientColor1(c); onGradientChange({ type: "linear", colorStops: { "0": c, "1": gradientColor2 } }) }} label="Start" />
                    <ColorPicker color={gradientColor2} onChange={(c) => { setGradientColor2(c); onGradientChange({ type: "linear", colorStops: { "0": gradientColor1, "1": c } }) }} label="End" />
                    <div className="flex gap-1">
                      <button onClick={() => onGradientChange({ type: "linear", colorStops: { "0": gradientColor1, "1": gradientColor2 } })} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover" title="Linear gradient - colors blend in a straight line">Linear</button>
                      <button onClick={() => onGradientChange({ type: "radial", colorStops: { "0": gradientColor1, "1": gradientColor2 } })} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover" title="Radial gradient - colors blend from center outward">Radial</button>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer" title="Include this fill when exporting">
                  <input type="checkbox" checked={showInExports} onChange={(e) => setShowInExports(e.target.checked)} className="w-3.5 h-3.5 rounded accent-canvas-accent" />
                  <span className="text-xs text-canvas-text-secondary">Show in exports</span>
                </label>
              </div>
            ) : (
              <button onClick={() => { setHasFill(true); setFillType("solid"); setFillVisible(true); onFillChange(lastSolidColor) }} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors" title="Add a fill color to this object">+ Add fill</button>
            )}
          </Section>

          {/* ===== STROKE SECTION ===== */}
          <Section title="Stroke" headerRight={
            <button onClick={() => { if (!hasStroke) { setHasStroke(true); setStrokeVisible(true); onStrokeChange(objectProps.stroke || "#000000", 1) } }} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add a stroke (border)"><Plus size={13} /></button>
          }>
            {hasStroke ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md border border-canvas-border shadow-sm flex-shrink-0" style={{ backgroundColor: objectProps.stroke || "#000000" }} title={`Stroke color: ${objectProps.stroke || "#000000"}`} />
                  <div className="flex-1 flex items-center bg-canvas-bg border border-canvas-border rounded-lg overflow-hidden" title="Stroke color hex value">
                    <input type="text" value={isStrokeHexFocused ? strokeHexInput : (objectProps.stroke || "#000000").replace("#", "").toUpperCase()} onFocus={() => { setStrokeHexInput((objectProps.stroke || "#000000").replace("#", "").toUpperCase()); setIsStrokeHexFocused(true) }} onBlur={() => { setIsStrokeHexFocused(false); const hex = strokeHexInput.replace("#", ""); if (/^[0-9A-Fa-f]{6}$/.test(hex)) { onStrokeChange("#" + hex, objectProps.strokeWidth || 1) } }} onChange={(e) => { const hex = e.target.value.replace("#", ""); setStrokeHexInput(hex); if (/^[0-9A-Fa-f]{6}$/.test(hex)) { onStrokeChange("#" + hex, objectProps.strokeWidth || 1) } }} className="flex-1 text-xs bg-transparent px-2 py-1 focus:outline-none text-canvas-text font-mono min-w-0" title="Enter stroke hex color" />
                    <div className="flex items-center border-l border-canvas-border px-1.5 py-1" title="Stroke opacity percentage">
                      <input type="number" value={strokeOpacity} onChange={(e) => { const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)); setStrokeOpacity(v); onPropertyChange('strokeOpacity', v / 100) }} min={0} max={100} className="w-8 text-xs bg-transparent border-none focus:outline-none text-canvas-text text-right" title="Stroke opacity (0-100%)" />
                      <span className="text-xs text-canvas-text-tertiary ml-0.5">%</span>
                    </div>
                  </div>
                  <button onClick={handleToggleStrokeVisible} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={strokeVisible ? "Hide stroke - temporarily make stroke invisible" : "Show stroke - restore stroke visibility"}>
                    {strokeVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => { setHasStroke(false); setStrokeVisible(false); onStrokeChange(objectProps.stroke || "#000000", 0) }} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove stroke entirely"><Minus size={13} /></button>
                </div>
                <ColorPicker color={objectProps.stroke || "#000000"} onChange={(c) => onStrokeChange(c, objectProps.strokeWidth || 1)} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Position</span>
                    <select value={objectProps.strokePosition || "center"} onChange={(e) => onStrokePositionChange?.(e.target.value as "center" | "inside" | "outside")} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Stroke position relative to the path">
                      <option value="center">Center</option>
                      <option value="inside">Inside</option>
                      <option value="outside">Outside</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Weight</span>
                    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title="Stroke width in pixels">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><line x1="1" y1="6" x2="11" y2="6" strokeWidth="2" /></svg>
                      <input type="number" value={objectProps.strokeWidth || 1} onChange={(e) => onStrokeChange(objectProps.stroke || "#000000", parseFloat(e.target.value) || 0)} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title="Stroke weight" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Line cap</span>
                    <select value={objectProps.strokeLineCap || 'butt'} onChange={(e) => onStrokeLineCapChange?.(e.target.value as CanvasLineCap)} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Stroke line cap style - how line endpoints look">
                      <option value="butt">Butt</option>
                      <option value="round">Round</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Line join</span>
                    <select value={objectProps.strokeLineJoin || 'miter'} onChange={(e) => onStrokeLineJoinChange?.(e.target.value as CanvasLineJoin)} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Stroke line join style - how corners look">
                      <option value="miter">Miter</option>
                      <option value="round">Round</option>
                      <option value="bevel">Bevel</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onStrokeDashChange([])} className={`flex-1 text-xxs py-1 rounded-md border ${!objectProps.strokeDashArray || objectProps.strokeDashArray.length === 0 ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`} title="Solid stroke line">Solid</button>
                  <button onClick={() => onStrokeDashChange([5, 5])} className={`flex-1 text-xxs py-1 rounded-md border ${objectProps.strokeDashArray?.length === 2 && objectProps.strokeDashArray[0] === 5 ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`} title="Dashed stroke line">Dashed</button>
                  <button onClick={() => onStrokeDashChange([2, 2])} className={`flex-1 text-xxs py-1 rounded-md border ${objectProps.strokeDashArray?.length === 2 && objectProps.strokeDashArray[0] === 2 ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`} title="Dotted stroke line">Dotted</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setHasStroke(true); setStrokeVisible(true); onStrokeChange("#000000", 1) }} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors" title="Add a stroke (border) to this object">+ Add stroke</button>
            )}
          </Section>

          {/* ===== EFFECTS SECTION ===== */}
          <Section title="Effects" headerRight={
            <button onClick={() => { if (!shadowEnabled) { setShadowEnabled(true); onShadowChange(shadowConfig) } }} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add a visual effect (shadow, blur)"><Plus size={13} /></button>
          }>
            {effects.length > 0 ? (
              <div className="space-y-2">
                {effects.map((effect, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" checked={effect.enabled} onChange={(e) => {
                        if (effect.type === "Drop shadow") { if (e.target.checked) { setShadowEnabled(true); onShadowChange(shadowConfig) } else { setShadowEnabled(false); onShadowRemove() } }
                        else if (effect.type === "Inner shadow") { if (e.target.checked) { setInnerShadowEnabled(true); onInnerShadowChange?.(innerShadowConfig) } else { setInnerShadowEnabled(false); onPropertyChange('_innerShadow', null) } }
                        else if (effect.type === "Layer blur") { if (!e.target.checked) { onBlurChange?.(0) } }
                      }} className="w-3.5 h-3.5 rounded accent-canvas-accent" title={`Toggle ${effect.type} on/off`} />
                      <select value={effect.type} onChange={(e) => {
                        const t = e.target.value
                        if (t === "Drop shadow" && !shadowEnabled) { setShadowEnabled(true); onShadowChange(shadowConfig) }
                        else if (t === "Inner shadow" && !innerShadowEnabled) { setInnerShadowEnabled(true); onInnerShadowChange?.(innerShadowConfig) }
                        else if (t === "Layer blur") { onBlurChange?.(10) }
                      }} className="flex-1 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Effect type">
                        <option value="Drop shadow">Drop shadow</option>
                        <option value="Inner shadow">Inner shadow</option>
                        <option value="Layer blur">Layer blur</option>
                        <option value="Background blur">Background blur</option>
                      </select>
                      <button onClick={() => {
                        if (effect.type === "Drop shadow") {
                          const newEnabled = !effect.enabled
                          if (newEnabled) { setShadowEnabled(true); onShadowChange(shadowConfig) } else { setShadowEnabled(false); onShadowRemove() }
                        } else if (effect.type === "Inner shadow") {
                          const newEnabled = !effect.enabled
                          if (newEnabled) { setInnerShadowEnabled(true); onInnerShadowChange?.(innerShadowConfig) } else { setInnerShadowEnabled(false); onPropertyChange('_innerShadow', null) }
                        } else if (effect.type === "Layer blur") {
                          if (effect.enabled) { onBlurChange?.(0) } else { onBlurChange?.(10) }
                        }
                      }} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={`Toggle ${effect.type} visibility`}>
                        {effect.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button onClick={() => {
                        if (effect.type === "Drop shadow") { setShadowEnabled(false); onShadowRemove() }
                        else if (effect.type === "Inner shadow") { setInnerShadowEnabled(false); onPropertyChange('_innerShadow', null) }
                        else if (effect.type === "Layer blur") { onBlurChange?.(0) }
                      }} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={`Remove ${effect.type}`}><Minus size={13} /></button>
                    </div>
                    {effect.type === "Drop shadow" && effect.enabled && (
                      <div className="pl-5 space-y-1.5">
                        <ColorPicker color={shadowConfig.color} onChange={(c) => { const cfg = { ...shadowConfig, color: c }; setShadowConfig(cfg); onShadowChange(cfg) }} label="Color" />
                        <PropInput label="Blur" value={shadowConfig.blur} onChange={(v) => { const cfg = { ...shadowConfig, blur: v }; setShadowConfig(cfg); onShadowChange(cfg) }} min={0} title="Shadow blur radius" />
                        <div className="grid grid-cols-2 gap-2">
                          <PropInput label="X" value={shadowConfig.offsetX} onChange={(v) => { const cfg = { ...shadowConfig, offsetX: v }; setShadowConfig(cfg); onShadowChange(cfg) }} title="Shadow horizontal offset" />
                          <PropInput label="Y" value={shadowConfig.offsetY} onChange={(v) => { const cfg = { ...shadowConfig, offsetY: v }; setShadowConfig(cfg); onShadowChange(cfg) }} title="Shadow vertical offset" />
                        </div>
                      </div>
                    )}
                    {effect.type === "Inner shadow" && effect.enabled && (
                      <div className="pl-5 space-y-1.5">
                        <PropInput label="Blur" value={innerShadowConfig.blur} onChange={(v) => { const cfg = { ...innerShadowConfig, blur: v }; setInnerShadowConfig(cfg); onInnerShadowChange?.(cfg) }} min={0} title="Inner shadow blur radius" />
                        <div className="grid grid-cols-2 gap-2">
                          <PropInput label="X" value={innerShadowConfig.offsetX} onChange={(v) => { const cfg = { ...innerShadowConfig, offsetX: v }; setInnerShadowConfig(cfg); onInnerShadowChange?.(cfg) }} title="Inner shadow horizontal offset" />
                          <PropInput label="Y" value={innerShadowConfig.offsetY} onChange={(v) => { const cfg = { ...innerShadowConfig, offsetY: v }; setInnerShadowConfig(cfg); onInnerShadowChange?.(cfg) }} title="Inner shadow vertical offset" />
                        </div>
                      </div>
                    )}
                    {effect.type === "Layer blur" && effect.enabled && (
                      <div className="pl-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xxs text-canvas-text-secondary w-8">Blur</span>
                          <input type="range" min="0" max="100" step="1" value={objectProps.blurAmount || 0} onChange={(e) => onBlurChange?.(parseInt(e.target.value))} className="flex-1 h-1.5 bg-canvas-border rounded-full accent-canvas-accent" title={`Layer blur amount: ${objectProps.blurAmount || 0}px`} />
                          <span className="text-xxs text-canvas-text-secondary w-8 text-right">{objectProps.blurAmount || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => { setShadowEnabled(true); onShadowChange(shadowConfig) }} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors" title="Add a visual effect like drop shadow or blur">+ Add effect</button>
            )}
          </Section>

          {/* ===== IMAGE CONTROLS ===== */}
          {isImage && (
            <Section title="Image">
              <div className="space-y-2">
                <button onClick={() => { const w = objectProps.width || 200; const h = objectProps.height || 200; onCropImage?.({ left: -w * 0.125, top: -h * 0.125, width: w * 0.75, height: h * 0.75 }) }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover transition-colors" title="Crop the image to a smaller area"><Crop size={14} /> Crop Image</button>
                <button onClick={() => onResetCrop?.()} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover transition-colors" title="Reset crop to show full image">Reset Crop</button>
                <button onClick={() => onFlatten?.()} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover transition-colors" title="Flatten all effects into a single rasterized image"><Sparkles size={14} /> Flatten / Rasterize</button>
              </div>
            </Section>
          )}

          {/* ===== SELECTION COLORS ===== */}
          <Section title="Selection colors">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md border border-canvas-border" style={{ backgroundColor: fillColor }} title={`Fill: ${fillColor}`} />
              {objectProps.stroke && objectProps.strokeWidth > 0 && (
                <div className="w-6 h-6 rounded-md border border-canvas-border" style={{ backgroundColor: objectProps.stroke }} title={`Stroke: ${objectProps.stroke}`} />
              )}
            </div>
          </Section>

          {/* ===== LAYOUT GUIDE ===== */}
          {(isFrame || isRect) && (
            <Section title="Layout guide" headerRight={
              <button onClick={() => setLayoutGuides(prev => [...prev, { type: "grid", size: 10, visible: true }])} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add a layout grid guide"><Plus size={13} /></button>
            }>
              {layoutGuides.length > 0 ? (
                <div className="space-y-2">
                  {layoutGuides.map((guide, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-canvas-bg border border-canvas-border flex items-center justify-center" title="Layout grid"><Grid3X3 size={12} className="text-canvas-accent" /></div>
                      <select value={`${guide.type}-${guide.size}`} onChange={(e) => {
                        const [type, size] = e.target.value.split("-")
                        setLayoutGuides(prev => prev.map((g, i) => i === idx ? { ...g, type, size: parseInt(size) } : g))
                      }} className="flex-1 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Select grid type and size">
                        <option value="grid-10">Grid 10px</option><option value="grid-8">Grid 8px</option><option value="columns-12">Columns</option><option value="rows-12">Rows</option>
                      </select>
                      <button onClick={() => setLayoutGuides(prev => prev.map((g, i) => i === idx ? { ...g, visible: !g.visible } : g))} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={guide.visible ? "Hide this guide" : "Show this guide"}>
                        {guide.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button onClick={() => setLayoutGuides(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove this layout guide"><Minus size={13} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => setLayoutGuides([{ type: "grid", size: 10, visible: true }])} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors" title="Add a layout grid to help with alignment">+ Add layout guide</button>
              )}
            </Section>
          )}

          {/* ===== EXPORT SECTION ===== */}
          <Section title="Export" headerRight={
            <button onClick={() => setExportPresets(prev => [...prev, { scale: 1, format: "png" }])} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add an export preset"><Plus size={13} /></button>
          }>
            {exportPresets.length > 0 ? (
              <div className="space-y-2">
                {exportPresets.map((preset, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <select value={preset.scale} onChange={(e) => setExportPresets(prev => prev.map((p, i) => i === idx ? { ...p, scale: Number(e.target.value) } : p))} className="w-16 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Export scale multiplier">
                      <option value={0.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option><option value={4}>4x</option>
                    </select>
                    <select value={preset.format} onChange={(e) => setExportPresets(prev => prev.map((p, i) => i === idx ? { ...p, format: e.target.value } : p))} className="flex-1 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" title="Export file format">
                      <option value="png">PNG</option><option value="svg">SVG</option><option value="jpg">JPG</option><option value="pdf">PDF</option>
                    </select>
                    <button onClick={() => setExportPresets(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove this export preset"><Minus size={13} /></button>
                  </div>
                ))}
                <button onClick={() => { for (const preset of exportPresets) { onExportSelected?.(preset.format, preset.scale) } }} className="flex items-center justify-center gap-2 w-full px-2 py-2 rounded-lg text-xs bg-canvas-accent text-white hover:bg-canvas-accent/90 transition-colors font-medium" title={`Export ${objectProps.name || objectType} with all presets`}>
                  <Download size={14} /> Export {objectProps.name || objectType}
                </button>
              </div>
            ) : (
              <button onClick={() => setExportPresets([{ scale: 1, format: "png" }])} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors" title="Add an export preset to export this object">+ Add export</button>
            )}
          </Section>

          {/* ===== ORDER ===== */}
          <Section title="Order">
            <div className="grid grid-cols-4 gap-1">
              <OrderBtn icon={<ArrowUpToLine size={14} />} onClick={onBringToFront} title="Bring to front - move above all other objects" />
              <OrderBtn icon={<ArrowUp size={14} />} onClick={onBringForward} title="Bring forward - move up one layer" />
              <OrderBtn icon={<ArrowDown size={14} />} onClick={onSendBackward} title="Send backward - move down one layer" />
              <OrderBtn icon={<ArrowDownToLine size={14} />} onClick={onSendToBack} title="Send to back - move below all other objects" />
            </div>
          </Section>

          <div className="h-6" />
        </div>
      )}
    </div>
  )
}

// ===== Sub-components =====

function Section({ title, children, headerRight }: { title: string, children: React.ReactNode, headerRight?: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-canvas-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-canvas-text">{title}</h3>
        {headerRight}
      </div>
      {children}
    </div>
  )
}

function PropInput({ label, value, onChange, min, max, step, title }: { label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number, title?: string }) {
  return (
    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1" title={title}>
      {label && <span className="text-xs text-canvas-text-tertiary flex-shrink-0">{label}</span>}
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} min={min} max={max} step={step || 1} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" title={title} />
    </div>
  )
}

function AlignBtn({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button onClick={onClick} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary hover:text-canvas-text transition-colors" title={title}>
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}

function FlowBtn({ icon, active, onClick, title }: { icon: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button onClick={onClick} className={`flex-1 p-1.5 rounded-lg border transition-colors ${active ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover"}`} title={title}>
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}

function TextStyleBtn({ icon, active, onClick, title }: { icon: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button onClick={onClick} className={`flex-1 p-1.5 rounded-md transition-colors ${active ? "bg-canvas-accent text-white" : "text-canvas-text-secondary hover:bg-canvas-hover"}`} title={title}>
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}

function OrderBtn({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button onClick={onClick} className="p-1.5 rounded-md bg-canvas-bg hover:bg-canvas-hover border border-canvas-border text-canvas-text-secondary hover:text-canvas-text transition-colors" title={title}>
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}
