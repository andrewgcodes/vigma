"use client"

import React, { useState, useEffect } from "react"
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
  Rows3, Columns3, LayoutGrid
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
  const [hasStroke, setHasStroke] = useState(false)
  const [hasFill, setHasFill] = useState(true)
  const [effects, setEffects] = useState<Array<{ type: string, enabled: boolean }>>([])
  const [exportPresets, setExportPresets] = useState<Array<{ scale: number, format: string }>>([])
  const [layoutGuides, setLayoutGuides] = useState<Array<{ type: string, size: number, visible: boolean }>>([])

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
      }
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
    setHasStroke(!!(objectProps?.strokeWidth && objectProps.strokeWidth > 0))
  }, [objectProps?.strokeWidth, objectProps?.id])

  // Sync effects from shadow/inner shadow
  useEffect(() => {
    const effs: Array<{ type: string, enabled: boolean }> = []
    if (shadowEnabled) {
      effs.push({ type: "Drop shadow", enabled: true })
    }
    if (innerShadowEnabled) {
      effs.push({ type: "Inner shadow", enabled: true })
    }
    if (objectProps?.blurAmount && objectProps.blurAmount > 0) {
      effs.push({ type: "Layer blur", enabled: true })
    }
    setEffects(effs)
  }, [shadowEnabled, innerShadowEnabled, objectProps?.blurAmount, objectProps?.id])

  if (!objectProps) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center border-b border-canvas-border">
          <button className="flex-1 px-4 py-2.5 text-xs font-medium text-canvas-accent relative">
            Design
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-canvas-accent rounded-full" />
          </button>
          <button className="flex-1 px-4 py-2.5 text-xs font-medium text-canvas-text-secondary hover:text-canvas-text">
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

  return (
    <div className="flex flex-col h-full overflow-y-auto text-canvas-text">
      {/* Design / Prototype tabs */}
      <div className="flex items-center border-b border-canvas-border flex-shrink-0">
        <button
          onClick={() => setActiveTab("design")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium relative transition-colors ${activeTab === "design" ? "text-canvas-accent" : "text-canvas-text-secondary hover:text-canvas-text"}`}
        >
          Design
          {activeTab === "design" && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-canvas-accent rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab("prototype")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium relative transition-colors ${activeTab === "prototype" ? "text-canvas-accent" : "text-canvas-text-secondary hover:text-canvas-text"}`}
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
              <button className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="View code">
                <Code size={14} />
              </button>
              <button className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Component settings">
                <Settings size={14} />
              </button>
              <button className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="More options">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* ===== POSITION SECTION ===== */}
          <Section title="Position">
            <div className="mb-3">
              <span className="text-xxs text-canvas-text-tertiary mb-1 block">Alignment</span>
              <div className="flex items-center gap-0.5">
                <div className="flex items-center gap-0.5 pr-2 border-r border-canvas-border">
                  <AlignBtn icon={<AlignStartVertical size={14} />} onClick={() => onAlignObjects("left")} title="Align left" />
                  <AlignBtn icon={<AlignCenterVertical size={14} />} onClick={() => onAlignObjects("center")} title="Align center" />
                  <AlignBtn icon={<AlignEndVertical size={14} />} onClick={() => onAlignObjects("right")} title="Align right" />
                </div>
                <div className="flex items-center gap-0.5 pl-1">
                  <AlignBtn icon={<AlignStartHorizontal size={14} />} onClick={() => onAlignObjects("top")} title="Align top" />
                  <AlignBtn icon={<AlignCenterHorizontal size={14} />} onClick={() => onAlignObjects("middle")} title="Align middle" />
                  <AlignBtn icon={<AlignEndHorizontal size={14} />} onClick={() => onAlignObjects("bottom")} title="Align bottom" />
                </div>
                <div className="ml-auto flex gap-0.5">
                  <button onClick={() => onDistribute("horizontal")} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Distribute horizontally">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="7" x2="13" y2="7" /><line x1="3" y1="3" x2="3" y2="11" /><line x1="11" y1="3" x2="11" y2="11" /></svg>
                  </button>
                  <button onClick={() => onDistribute("vertical")} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Distribute vertically">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="7" y1="1" x2="7" y2="13" /><line x1="3" y1="3" x2="11" y2="3" /><line x1="3" y1="11" x2="11" y2="11" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <div className="grid grid-cols-2 gap-2">
                <PropInput label="X" value={objectProps.left} onChange={(v) => onPositionChange(v, objectProps.top)} />
                <PropInput label="Y" value={objectProps.top} onChange={(v) => onPositionChange(objectProps.left, v)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <PropInput label={"↺"} value={objectProps.angle} onChange={(v) => onRotationChange(v)} />
              </div>
              <button onClick={onFlipH} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Flip horizontal"><FlipHorizontal size={14} /></button>
              <button onClick={onFlipV} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Flip vertical"><FlipVertical size={14} /></button>
              <button onClick={() => onLock(!objectProps.locked)} className={`p-1.5 rounded hover:bg-canvas-hover ${objectProps.locked ? "text-orange-500" : "text-canvas-text-secondary"}`} title={objectProps.locked ? "Unlock" : "Lock"}>
                {objectProps.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
          </Section>

          {/* ===== LAYOUT SECTION ===== */}
          <Section title="Layout">
            {(isFrame || isRect) && (
              <div className="mb-3">
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Flow</span>
                <div className="flex items-center gap-0.5">
                  <FlowBtn icon={<LayoutGrid size={14} />} active={false} onClick={() => {}} title="Wrap" />
                  <FlowBtn icon={<Columns3 size={14} />} active={false} onClick={() => {}} title="Vertical" />
                  <FlowBtn icon={<Rows3 size={14} />} active={false} onClick={() => {}} title="Horizontal" />
                  <FlowBtn icon={<Grid3X3 size={14} />} active={false} onClick={() => {}} title="Grid" />
                </div>
              </div>
            )}
            {isText && (
              <div className="mb-3">
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Resizing</span>
                <div className="flex items-center bg-canvas-bg rounded-lg border border-canvas-border p-0.5">
                  <button className="flex-1 p-1.5 rounded text-canvas-text-secondary hover:bg-canvas-hover text-center" title="Fixed width">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto"><line x1="3" y1="4" x2="3" y2="10" /><line x1="3" y1="7" x2="11" y2="7" /><polyline points="8,5 11,7 8,9" /></svg>
                  </button>
                  <button className="flex-1 p-1.5 rounded text-canvas-text-secondary hover:bg-canvas-hover text-center" title="Auto width">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto"><line x1="3" y1="4" x2="3" y2="10" /><line x1="7" y1="4" x2="7" y2="10" /><line x1="11" y1="4" x2="11" y2="10" /></svg>
                  </button>
                  <button className="flex-1 p-1.5 rounded bg-canvas-hover text-canvas-text text-center" title="Auto height">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto"><rect x="2" y="3" width="10" height="8" rx="1" /></svg>
                  </button>
                </div>
              </div>
            )}
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <div className="flex-1"><PropInput label="W" value={objectProps.width} onChange={(v) => onSizeChange(v, objectProps.height)} /></div>
                <div className="flex-1"><PropInput label="H" value={objectProps.height} onChange={(v) => onSizeChange(objectProps.width, v)} /></div>
                <button className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Constrain proportions">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3v3M10 3h-3M4 11V8M4 11h3" /></svg>
                </button>
              </div>
            </div>
            {(isFrame || isRect) && (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={clipContent} onChange={(e) => setClipContent(e.target.checked)} className="w-3.5 h-3.5 rounded accent-canvas-accent" />
                <span className="text-xs text-canvas-text-secondary">Clip content</span>
              </label>
            )}
          </Section>

          {/* ===== APPEARANCE SECTION ===== */}
          <Section title="Appearance" headerRight={
            <button className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Toggle visibility"><Eye size={13} /></button>
          }>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Opacity</span>
                <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                  <select value={objectProps.blendMode || "source-over"} onChange={(e) => onBlendModeChange?.(e.target.value)} className="text-xs bg-transparent border-none focus:outline-none text-canvas-text-secondary w-5 appearance-none cursor-pointer" title="Blend mode">
                    {BLEND_MODES.map(mode => (<option key={mode} value={mode}>{BLEND_MODE_LABELS[mode] || mode}</option>))}
                  </select>
                  <input type="number" value={Math.round((objectProps.opacity ?? 1) * 100)} onChange={(e) => onOpacityChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)} min={0} max={100} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text text-right" />
                  <span className="text-xs text-canvas-text-tertiary">%</span>
                </div>
              </div>
              <div>
                <span className="text-xxs text-canvas-text-tertiary mb-1 block">Corner radius</span>
                {isRect || isFrame ? (
                  <div className="flex items-center gap-1">
                    <div className="flex-1 flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M1 8V4C1 2.34 2.34 1 4 1H8" /></svg>
                      <input type="number" value={objectProps.rx || 0} onChange={(e) => onCornerRadiusChange(parseFloat(e.target.value) || 0)} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                    </div>
                    <button onClick={() => setShowIndividualCorners(!showIndividualCorners)} className={`p-1 rounded hover:bg-canvas-hover flex-shrink-0 ${showIndividualCorners ? "text-canvas-accent" : "text-canvas-text-tertiary"}`} title="Individual corners">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5V3C1 1.9 1.9 1 3 1H5M9 1H11C12.1 1 13 1.9 13 3V5M13 9V11C12.1 13 12.1 13 11 13H9M5 13H3C1.9 13 1 12.1 1 11V9" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M1 8V4C1 2.34 2.34 1 4 1H8" /></svg>
                    <span className="text-xs text-canvas-text-tertiary">--</span>
                  </div>
                )}
              </div>
            </div>
            {showIndividualCorners && (isRect || isFrame) && (
              <div className="mb-2">
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.tl} onChange={(e) => { const c = { ...individualCorners, tl: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                  </div>
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0 -scale-x-100"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.tr} onChange={(e) => { const c = { ...individualCorners, tr: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0 -scale-y-100"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.bl} onChange={(e) => { const c = { ...individualCorners, bl: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                  </div>
                  <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-canvas-text-tertiary flex-shrink-0 scale-x-[-1] scale-y-[-1]"><path d="M1 8V3C1 1.9 1.9 1 3 1H8" /></svg>
                    <input type="number" value={individualCorners.br} onChange={(e) => { const c = { ...individualCorners, br: parseFloat(e.target.value) || 0 }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                  </div>
                </div>
                <button onClick={() => { setShowIndividualCorners(false); const avg = Math.round((individualCorners.tl + individualCorners.tr + individualCorners.br + individualCorners.bl) / 4); onCornerRadiusChange(avg) }} className="text-xxs text-canvas-accent hover:underline">Uniform radius</button>
              </div>
            )}
          </Section>

          {/* ===== TYPOGRAPHY (Text only) ===== */}
          {isText && (
            <Section title="Typography" headerRight={
              <button className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Type settings"><Settings size={13} /></button>
            }>
              <div className="space-y-2">
                <select value={objectProps.fontFamily || "Inter"} onChange={(e) => onTextPropertyChange("fontFamily", e.target.value)} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent">
                  {["Inter", "Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New", "Verdana", "Trebuchet MS", "Palatino", "Garamond", "Comic Sans MS", "Impact", "Lucida Console", "Tahoma"].map(f => (<option key={f} value={f}>{f}</option>))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select value={objectProps.fontWeight || "normal"} onChange={(e) => onTextPropertyChange("fontWeight", e.target.value)} className="text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent">
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
                  <PropInput label="" value={objectProps.fontSize || 20} onChange={(v) => onTextPropertyChange("fontSize", v)} min={1} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Line height</span>
                    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M2 2h8M2 6h8M2 10h8" /></svg>
                      <input type="number" value={objectProps.lineHeight || 1.2} onChange={(e) => onTextPropertyChange("lineHeight", parseFloat(e.target.value) || 1.2)} step={0.1} min={0.5} max={5} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Letter spacing</span>
                    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><path d="M3 2L6 10M9 2L6 10" /></svg>
                      <input type="number" value={objectProps.charSpacing || 0} onChange={(e) => onTextPropertyChange("charSpacing", parseFloat(e.target.value) || 0)} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xxs text-canvas-text-tertiary mb-1 block">Alignment</span>
                  <div className="flex items-center gap-0.5">
                    <div className="flex items-center gap-0.5 pr-2 border-r border-canvas-border">
                      <TextStyleBtn icon={<AlignLeft size={14} />} active={objectProps.textAlign === "left"} onClick={() => onTextPropertyChange("textAlign", "left")} title="Align left" />
                      <TextStyleBtn icon={<AlignCenter size={14} />} active={objectProps.textAlign === "center"} onClick={() => onTextPropertyChange("textAlign", "center")} title="Align center" />
                      <TextStyleBtn icon={<AlignRight size={14} />} active={objectProps.textAlign === "right"} onClick={() => onTextPropertyChange("textAlign", "right")} title="Align right" />
                    </div>
                    <div className="flex items-center gap-0.5 pl-1">
                      <TextStyleBtn icon={<AlignVerticalJustifyStart size={14} />} active={false} onClick={() => {}} title="Align top" />
                      <TextStyleBtn icon={<AlignVerticalJustifyCenter size={14} />} active={false} onClick={() => {}} title="Align middle" />
                      <TextStyleBtn icon={<AlignVerticalJustifyEnd size={14} />} active={false} onClick={() => {}} title="Align bottom" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <TextStyleBtn icon={<Bold size={14} />} active={objectProps.fontWeight === "bold" || objectProps.fontWeight === "700"} onClick={() => onTextPropertyChange("fontWeight", objectProps.fontWeight === "bold" ? "normal" : "bold")} title="Bold" />
                  <TextStyleBtn icon={<Italic size={14} />} active={objectProps.fontStyle === "italic"} onClick={() => onTextPropertyChange("fontStyle", objectProps.fontStyle === "italic" ? "normal" : "italic")} title="Italic" />
                  <TextStyleBtn icon={<Underline size={14} />} active={objectProps.underline} onClick={() => onTextPropertyChange("underline", !objectProps.underline)} title="Underline" />
                  <TextStyleBtn icon={<Strikethrough size={14} />} active={objectProps.linethrough} onClick={() => onTextPropertyChange("linethrough", !objectProps.linethrough)} title="Strikethrough" />
                </div>
              </div>
            </Section>
          )}

          {/* ===== FILL SECTION ===== */}
          <Section title="Fill" headerRight={
            <button onClick={() => { if (!hasFill) { setHasFill(true); setFillType("solid"); onFillChange(lastSolidColor) } }} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add fill"><Plus size={13} /></button>
          }>
            {hasFill && fillType !== "none" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md border border-canvas-border shadow-sm flex-shrink-0" style={{ backgroundColor: fillColor }} title="Fill color" />
                  <div className="flex-1 flex items-center bg-canvas-bg border border-canvas-border rounded-lg overflow-hidden">
                    <input type="text" value={displayFillColor} onChange={(e) => { const hex = e.target.value.replace("#", ""); if (/^[0-9A-Fa-f]{6}$/.test(hex)) { onFillChange("#" + hex) } }} className="flex-1 text-xs bg-transparent px-2 py-1 focus:outline-none text-canvas-text font-mono min-w-0" />
                    <div className="flex items-center border-l border-canvas-border px-1.5 py-1">
                      <input type="number" value={fillOpacity} onChange={(e) => setFillOpacity(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} min={0} max={100} className="w-8 text-xs bg-transparent border-none focus:outline-none text-canvas-text text-right" />
                      <span className="text-xs text-canvas-text-tertiary ml-0.5">%</span>
                    </div>
                  </div>
                  <button onClick={() => setFillVisible(!fillVisible)} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={fillVisible ? "Hide fill" : "Show fill"}>
                    {fillVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => { setHasFill(false); setFillType("none"); onFillChange("transparent") }} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove fill"><Minus size={13} /></button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setFillType("solid"); onFillChange((fillType === "gradient" || fillColor === "transparent") ? lastSolidColor : fillColor) }} className={`flex-1 text-xxs py-1 rounded-md border ${fillType === "solid" ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`}>Solid</button>
                  <button onClick={() => { setFillType("gradient"); onGradientChange({ type: "linear", colorStops: { "0": gradientColor1, "1": gradientColor2 } }) }} className={`flex-1 text-xxs py-1 rounded-md border ${fillType === "gradient" ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`}>Gradient</button>
                </div>
                {fillType === "solid" && (<ColorPicker color={fillColor} onChange={onFillChange} />)}
                {fillType === "gradient" && (
                  <div className="space-y-2">
                    <ColorPicker color={gradientColor1} onChange={(c) => { setGradientColor1(c); onGradientChange({ type: "linear", colorStops: { "0": c, "1": gradientColor2 } }) }} label="Start" />
                    <ColorPicker color={gradientColor2} onChange={(c) => { setGradientColor2(c); onGradientChange({ type: "linear", colorStops: { "0": gradientColor1, "1": c } }) }} label="End" />
                    <div className="flex gap-1">
                      <button onClick={() => onGradientChange({ type: "linear", colorStops: { "0": gradientColor1, "1": gradientColor2 } })} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover">Linear</button>
                      <button onClick={() => onGradientChange({ type: "radial", colorStops: { "0": gradientColor1, "1": gradientColor2 } })} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover">Radial</button>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showInExports} onChange={(e) => setShowInExports(e.target.checked)} className="w-3.5 h-3.5 rounded accent-canvas-accent" />
                  <span className="text-xs text-canvas-text-secondary">Show in exports</span>
                </label>
              </div>
            ) : (
              <button onClick={() => { setHasFill(true); setFillType("solid"); onFillChange(lastSolidColor) }} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors">+ Add fill</button>
            )}
          </Section>

          {/* ===== STROKE SECTION ===== */}
          <Section title="Stroke" headerRight={
            <button onClick={() => { if (!hasStroke) { setHasStroke(true); onStrokeChange(objectProps.stroke || "#000000", 1) } }} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add stroke"><Plus size={13} /></button>
          }>
            {hasStroke ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md border border-canvas-border shadow-sm flex-shrink-0" style={{ backgroundColor: objectProps.stroke || "#000000" }} title="Stroke color" />
                  <div className="flex-1 flex items-center bg-canvas-bg border border-canvas-border rounded-lg overflow-hidden">
                    <input type="text" value={(objectProps.stroke || "#000000").replace("#", "").toUpperCase()} onChange={(e) => { const hex = e.target.value.replace("#", ""); if (/^[0-9A-Fa-f]{6}$/.test(hex)) { onStrokeChange("#" + hex, objectProps.strokeWidth || 1) } }} className="flex-1 text-xs bg-transparent px-2 py-1 focus:outline-none text-canvas-text font-mono min-w-0" />
                    <div className="flex items-center border-l border-canvas-border px-1.5 py-1">
                      <input type="number" value={strokeOpacity} onChange={(e) => setStrokeOpacity(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} min={0} max={100} className="w-8 text-xs bg-transparent border-none focus:outline-none text-canvas-text text-right" />
                      <span className="text-xs text-canvas-text-tertiary ml-0.5">%</span>
                    </div>
                  </div>
                  <button onClick={() => setStrokeVisible(!strokeVisible)} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={strokeVisible ? "Hide stroke" : "Show stroke"}>
                    {strokeVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => { setHasStroke(false); onStrokeChange(objectProps.stroke || "#000000", 0) }} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove stroke"><Minus size={13} /></button>
                </div>
                <ColorPicker color={objectProps.stroke || "#000000"} onChange={(c) => onStrokeChange(c, objectProps.strokeWidth || 1)} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Position</span>
                    <select value={objectProps.strokePosition || "center"} onChange={(e) => onStrokePositionChange?.(e.target.value as "center" | "inside" | "outside")} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text">
                      <option value="center">Center</option>
                      <option value="inside">Inside</option>
                      <option value="outside">Outside</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">Weight</span>
                    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-canvas-text-tertiary flex-shrink-0"><line x1="1" y1="6" x2="11" y2="6" strokeWidth="2" /></svg>
                      <input type="number" value={objectProps.strokeWidth || 1} onChange={(e) => onStrokeChange(objectProps.stroke || "#000000", parseFloat(e.target.value) || 0)} min={0} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xxs text-canvas-text-tertiary mb-0.5 block">End points</span>
                  <select className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text">
                    <option value="none">None</option>
                    <option value="arrow">Arrow</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onStrokeDashChange([])} className={`flex-1 text-xxs py-1 rounded-md border ${!objectProps.strokeDashArray || objectProps.strokeDashArray.length === 0 ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`}>Solid</button>
                  <button onClick={() => onStrokeDashChange([5, 5])} className={`flex-1 text-xxs py-1 rounded-md border ${objectProps.strokeDashArray?.length === 2 && objectProps.strokeDashArray[0] === 5 ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`}>Dashed</button>
                  <button onClick={() => onStrokeDashChange([2, 2])} className={`flex-1 text-xxs py-1 rounded-md border ${objectProps.strokeDashArray?.length === 2 && objectProps.strokeDashArray[0] === 2 ? "bg-canvas-accent text-white border-canvas-accent" : "bg-canvas-bg border-canvas-border text-canvas-text-secondary"}`}>Dotted</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setHasStroke(true); onStrokeChange("#000000", 1) }} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors">+ Add stroke</button>
            )}
          </Section>

          {/* ===== EFFECTS SECTION ===== */}
          <Section title="Effects" headerRight={
            <button onClick={() => { if (!shadowEnabled) { setShadowEnabled(true); onShadowChange(shadowConfig) } }} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add effect"><Plus size={13} /></button>
          }>
            {effects.length > 0 ? (
              <div className="space-y-2">
                {effects.map((effect, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" checked={effect.enabled} onChange={(e) => {
                        if (effect.type === "Drop shadow") { if (e.target.checked) { setShadowEnabled(true); onShadowChange(shadowConfig) } else { setShadowEnabled(false); onShadowRemove() } }
                        else if (effect.type === "Inner shadow") { if (e.target.checked) { setInnerShadowEnabled(true); onInnerShadowChange?.(innerShadowConfig) } else { setInnerShadowEnabled(false); onShadowRemove() } }
                      }} className="w-3.5 h-3.5 rounded accent-canvas-accent" />
                      <select value={effect.type} onChange={(e) => {
                        const t = e.target.value
                        if (t === "Drop shadow" && !shadowEnabled) { setShadowEnabled(true); onShadowChange(shadowConfig) }
                        else if (t === "Inner shadow" && !innerShadowEnabled) { setInnerShadowEnabled(true); onInnerShadowChange?.(innerShadowConfig) }
                        else if (t === "Layer blur") { onBlurChange?.(10) }
                      }} className="flex-1 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text">
                        <option value="Drop shadow">Drop shadow</option>
                        <option value="Inner shadow">Inner shadow</option>
                        <option value="Layer blur">Layer blur</option>
                        <option value="Background blur">Background blur</option>
                      </select>
                      <button className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Toggle visibility"><Eye size={13} /></button>
                      <button onClick={() => {
                        if (effect.type === "Drop shadow") { setShadowEnabled(false); onShadowRemove() }
                        else if (effect.type === "Inner shadow") { setInnerShadowEnabled(false); onShadowRemove() }
                        else if (effect.type === "Layer blur") { onBlurChange?.(0) }
                      }} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove effect"><Minus size={13} /></button>
                    </div>
                    {effect.type === "Drop shadow" && effect.enabled && (
                      <div className="pl-5 space-y-1.5">
                        <ColorPicker color={shadowConfig.color} onChange={(c) => { const cfg = { ...shadowConfig, color: c }; setShadowConfig(cfg); onShadowChange(cfg) }} label="Color" />
                        <PropInput label="Blur" value={shadowConfig.blur} onChange={(v) => { const cfg = { ...shadowConfig, blur: v }; setShadowConfig(cfg); onShadowChange(cfg) }} min={0} />
                        <div className="grid grid-cols-2 gap-2">
                          <PropInput label="X" value={shadowConfig.offsetX} onChange={(v) => { const cfg = { ...shadowConfig, offsetX: v }; setShadowConfig(cfg); onShadowChange(cfg) }} />
                          <PropInput label="Y" value={shadowConfig.offsetY} onChange={(v) => { const cfg = { ...shadowConfig, offsetY: v }; setShadowConfig(cfg); onShadowChange(cfg) }} />
                        </div>
                      </div>
                    )}
                    {effect.type === "Inner shadow" && effect.enabled && (
                      <div className="pl-5 space-y-1.5">
                        <PropInput label="Blur" value={innerShadowConfig.blur} onChange={(v) => { const cfg = { ...innerShadowConfig, blur: v }; setInnerShadowConfig(cfg); onInnerShadowChange?.(cfg) }} min={0} />
                        <div className="grid grid-cols-2 gap-2">
                          <PropInput label="X" value={innerShadowConfig.offsetX} onChange={(v) => { const cfg = { ...innerShadowConfig, offsetX: v }; setInnerShadowConfig(cfg); onInnerShadowChange?.(cfg) }} />
                          <PropInput label="Y" value={innerShadowConfig.offsetY} onChange={(v) => { const cfg = { ...innerShadowConfig, offsetY: v }; setInnerShadowConfig(cfg); onInnerShadowChange?.(cfg) }} />
                        </div>
                      </div>
                    )}
                    {effect.type === "Layer blur" && effect.enabled && (
                      <div className="pl-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xxs text-canvas-text-secondary w-8">Blur</span>
                          <input type="range" min="0" max="100" step="1" value={objectProps.blurAmount || 0} onChange={(e) => onBlurChange?.(parseInt(e.target.value))} className="flex-1 h-1.5 bg-canvas-border rounded-full accent-canvas-accent" />
                          <span className="text-xxs text-canvas-text-secondary w-8 text-right">{objectProps.blurAmount || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => { setShadowEnabled(true); onShadowChange(shadowConfig) }} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors">+ Add effect</button>
            )}
          </Section>

          {/* ===== IMAGE CONTROLS ===== */}
          {isImage && (
            <Section title="Image">
              <div className="space-y-2">
                <button onClick={() => { const w = objectProps.width || 200; const h = objectProps.height || 200; onCropImage?.({ left: -w * 0.125, top: -h * 0.125, width: w * 0.75, height: h * 0.75 }) }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover transition-colors"><Crop size={14} /> Crop Image</button>
                <button onClick={() => onResetCrop?.()} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover transition-colors">Reset Crop</button>
                <button onClick={() => onFlatten?.()} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover transition-colors"><Sparkles size={14} /> Flatten / Rasterize</button>
              </div>
            </Section>
          )}

          {/* ===== SELECTION COLORS ===== */}
          <Section title="Selection colors">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md border border-canvas-border" style={{ backgroundColor: fillColor }} />
              {objectProps.stroke && objectProps.strokeWidth > 0 && (
                <div className="w-6 h-6 rounded-md border border-canvas-border" style={{ backgroundColor: objectProps.stroke }} />
              )}
            </div>
          </Section>

          {/* ===== LAYOUT GUIDE ===== */}
          {(isFrame || isRect) && (
            <Section title="Layout guide" headerRight={
              <button onClick={() => setLayoutGuides(prev => [...prev, { type: "grid", size: 10, visible: true }])} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add guide"><Plus size={13} /></button>
            }>
              {layoutGuides.length > 0 ? (
                <div className="space-y-2">
                  {layoutGuides.map((guide, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-canvas-bg border border-canvas-border flex items-center justify-center"><Grid3X3 size={12} className="text-canvas-accent" /></div>
                      <select className="flex-1 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text" onChange={() => {}}>
                        <option>Grid 10px</option><option>Grid 8px</option><option>Columns</option><option>Rows</option>
                      </select>
                      <button className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Toggle visibility"><Eye size={13} /></button>
                      <button onClick={() => setLayoutGuides(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove guide"><Minus size={13} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => setLayoutGuides([{ type: "grid", size: 10, visible: true }])} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors">+ Add layout guide</button>
              )}
            </Section>
          )}

          {/* ===== EXPORT SECTION ===== */}
          <Section title="Export" headerRight={
            <button onClick={() => setExportPresets(prev => [...prev, { scale: 1, format: "png" }])} className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Add export preset"><Plus size={13} /></button>
          }>
            {exportPresets.length > 0 ? (
              <div className="space-y-2">
                {exportPresets.map((preset, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <select value={preset.scale} onChange={(e) => setExportPresets(prev => prev.map((p, i) => i === idx ? { ...p, scale: Number(e.target.value) } : p))} className="w-16 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text">
                      <option value={0.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option><option value={4}>4x</option>
                    </select>
                    <select value={preset.format} onChange={(e) => setExportPresets(prev => prev.map((p, i) => i === idx ? { ...p, format: e.target.value } : p))} className="flex-1 text-xs bg-canvas-bg border border-canvas-border rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text">
                      <option value="png">PNG</option><option value="svg">SVG</option><option value="jpg">JPG</option><option value="pdf">PDF</option>
                    </select>
                    <button onClick={() => setExportPresets(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Remove preset"><Minus size={13} /></button>
                  </div>
                ))}
                <button onClick={() => { for (const preset of exportPresets) { onExportSelected?.(preset.format, preset.scale) } }} className="flex items-center justify-center gap-2 w-full px-2 py-2 rounded-lg text-xs bg-canvas-accent text-white hover:bg-canvas-accent/90 transition-colors font-medium">
                  <Download size={14} /> Export {objectProps.name || objectType}
                </button>
              </div>
            ) : (
              <button onClick={() => setExportPresets([{ scale: 1, format: "png" }])} className="w-full text-xs text-canvas-text-tertiary hover:text-canvas-text py-1.5 text-center border border-dashed border-canvas-border rounded-lg hover:bg-canvas-hover transition-colors">+ Add export</button>
            )}
          </Section>

          {/* ===== ORDER ===== */}
          <Section title="Order">
            <div className="grid grid-cols-4 gap-1">
              <OrderBtn icon={<ArrowUpToLine size={14} />} onClick={onBringToFront} title="Bring to front" />
              <OrderBtn icon={<ArrowUp size={14} />} onClick={onBringForward} title="Bring forward" />
              <OrderBtn icon={<ArrowDown size={14} />} onClick={onSendBackward} title="Send backward" />
              <OrderBtn icon={<ArrowDownToLine size={14} />} onClick={onSendToBack} title="Send to back" />
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

function PropInput({ label, value, onChange, min, max, step }: { label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number }) {
  return (
    <div className="flex items-center gap-1 bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1">
      {label && <span className="text-xs text-canvas-text-tertiary flex-shrink-0">{label}</span>}
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} min={min} max={max} step={step || 1} className="w-full text-xs bg-transparent border-none focus:outline-none text-canvas-text" />
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
