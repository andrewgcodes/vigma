'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Strikethrough,
  FlipHorizontal, FlipVertical, RotateCw,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown,
  Trash2, Copy, Clipboard, Scissors, Lock, Unlock,
  Sun, Moon, Layers, Download, Sparkles,
  Square
} from 'lucide-react'
import ColorPicker from './ColorPicker'

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
  onDistribute: (dir: 'horizontal' | 'vertical') => void
  onBlendModeChange?: (mode: string) => void
  onStrokePositionChange?: (position: 'center' | 'inside' | 'outside') => void
  onIndividualCornerChange?: (corners: { tl: number, tr: number, br: number, bl: number }) => void
  onBlurChange?: (blur: number) => void
  onInnerShadowChange?: (config: { color: string, blur: number, offsetX: number, offsetY: number }) => void
  onExportSelected?: (format: string, scale: number) => void
  onFlatten?: () => void
}

const BLEND_MODES = [
  'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
  'exclusion', 'hue', 'saturation', 'color', 'luminosity'
]

const BLEND_MODE_LABELS: Record<string, string> = {
  'source-over': 'Normal', 'multiply': 'Multiply', 'screen': 'Screen',
  'overlay': 'Overlay', 'darken': 'Darken', 'lighten': 'Lighten',
  'color-dodge': 'Color Dodge', 'color-burn': 'Color Burn',
  'hard-light': 'Hard Light', 'soft-light': 'Soft Light',
  'difference': 'Difference', 'exclusion': 'Exclusion',
  'hue': 'Hue', 'saturation': 'Saturation', 'color': 'Color', 'luminosity': 'Luminosity',
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
  onFlatten,
}: PropertiesPanelProps) {
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowConfig, setShadowConfig] = useState({ color: 'rgba(0,0,0,0.25)', blur: 10, offsetX: 0, offsetY: 4 })
  const [fillType, setFillType] = useState<'solid' | 'gradient'>('solid')
  const [gradientColor1, setGradientColor1] = useState('#4A90D9')
  const [gradientColor2, setGradientColor2] = useState('#50C878')
  const [showIndividualCorners, setShowIndividualCorners] = useState(false)
  const [individualCorners, setIndividualCorners] = useState({ tl: 0, tr: 0, br: 0, bl: 0 })
  const [innerShadowEnabled, setInnerShadowEnabled] = useState(false)
  const [innerShadowConfig, setInnerShadowConfig] = useState({ color: 'rgba(0,0,0,0.25)', blur: 10, offsetX: 0, offsetY: 4 })
  const [effectType, setEffectType] = useState<'drop-shadow' | 'inner-shadow' | 'layer-blur'>('drop-shadow')
  const [exportScale, setExportScale] = useState(2)
  const [exportFormat, setExportFormat] = useState('png')

  // Sync shadow state with selected object
  useEffect(() => {
    if (objectProps?.shadow) {
      setShadowEnabled(true)
      const s = objectProps.shadow
      if (s && typeof s === 'object') {
        setShadowConfig({
          color: s.color || 'rgba(0,0,0,0.25)',
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
    if (objectProps?.fill && typeof objectProps.fill === 'object' && objectProps.fill.type) {
      setFillType('gradient')
      const stops = objectProps.fill.colorStops
      if (stops && stops.length >= 2) {
        setGradientColor1(stops[0].color || '#4A90D9')
        setGradientColor2(stops[stops.length - 1].color || '#50C878')
      }
    } else {
      setFillType('solid')
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

  if (!objectProps) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
          <span className="text-xs font-semibold text-canvas-text uppercase tracking-wider">Properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-canvas-text-tertiary">Select an object</span>
        </div>
      </div>
    )
  }

  const isText = objectProps.type === 'textbox' || objectProps.type === 'i-text'
  const isRect = objectProps.type === 'rect' || objectProps.isRect
  const isImage = objectProps.isImage
  const fillColor = typeof objectProps.fill === 'string' ? objectProps.fill : '#4A90D9'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
        <span className="text-xs font-semibold text-canvas-text uppercase tracking-wider">
          {objectProps.name || objectProps.type}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} className="p-1 rounded-md hover:bg-canvas-hover text-canvas-text-secondary" title="Duplicate">
            <Copy size={13} />
          </button>
          <button onClick={onDelete} className="p-1 rounded-md hover:bg-red-50 text-canvas-text-secondary hover:text-red-500" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Alignment tools */}
        <Section title="Alignment">
          <div className="grid grid-cols-6 gap-1">
            <AlignBtn icon={<AlignStartVertical size={14} />} onClick={() => onAlignObjects('left')} title="Align left" />
            <AlignBtn icon={<AlignCenterVertical size={14} />} onClick={() => onAlignObjects('center')} title="Align center" />
            <AlignBtn icon={<AlignEndVertical size={14} />} onClick={() => onAlignObjects('right')} title="Align right" />
            <AlignBtn icon={<AlignStartHorizontal size={14} />} onClick={() => onAlignObjects('top')} title="Align top" />
            <AlignBtn icon={<AlignCenterHorizontal size={14} />} onClick={() => onAlignObjects('middle')} title="Align middle" />
            <AlignBtn icon={<AlignEndHorizontal size={14} />} onClick={() => onAlignObjects('bottom')} title="Align bottom" />
          </div>
          <div className="flex gap-1 mt-1">
            <button onClick={() => onDistribute('horizontal')} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg hover:bg-canvas-hover text-canvas-text-secondary border border-canvas-border">
              Distribute H
            </button>
            <button onClick={() => onDistribute('vertical')} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg hover:bg-canvas-hover text-canvas-text-secondary border border-canvas-border">
              Distribute V
            </button>
          </div>
        </Section>

        {/* Position & Size */}
        <Section title="Position">
          <div className="grid grid-cols-2 gap-2">
            <PropInput
              label="X"
              value={objectProps.left}
              onChange={(v) => onPositionChange(v, objectProps.top)}
            />
            <PropInput
              label="Y"
              value={objectProps.top}
              onChange={(v) => onPositionChange(objectProps.left, v)}
            />
          </div>
        </Section>

        <Section title="Size">
          <div className="grid grid-cols-2 gap-2">
            <PropInput
              label="W"
              value={objectProps.width}
              onChange={(v) => onSizeChange(v, objectProps.height)}
            />
            <PropInput
              label="H"
              value={objectProps.height}
              onChange={(v) => onSizeChange(objectProps.width, v)}
            />
          </div>
        </Section>

        <Section title="Rotation">
          <div className="grid grid-cols-2 gap-2">
            <PropInput
              label="°"
              value={objectProps.angle}
              onChange={(v) => onRotationChange(v)}
            />
            <div className="flex items-end gap-1">
              <button onClick={onFlipH} className="flex-1 p-1.5 rounded-lg bg-canvas-bg hover:bg-canvas-hover border border-canvas-border" title="Flip horizontal">
                <FlipHorizontal size={14} className="mx-auto text-canvas-text-secondary" />
              </button>
              <button onClick={onFlipV} className="flex-1 p-1.5 rounded-lg bg-canvas-bg hover:bg-canvas-hover border border-canvas-border" title="Flip vertical">
                <FlipVertical size={14} className="mx-auto text-canvas-text-secondary" />
              </button>
            </div>
          </div>
        </Section>

        {/* Corner Radius for Rects */}
        {isRect && (
          <Section title="Corner Radius">
            <div className="space-y-2">
              {!showIndividualCorners ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PropInput label="R" value={objectProps.rx || 0} onChange={(v) => onCornerRadiusChange(v)} min={0} />
                  </div>
                  <button onClick={() => setShowIndividualCorners(true)} className="p-1.5 rounded-lg bg-canvas-bg hover:bg-canvas-hover border border-canvas-border text-canvas-text-tertiary" title="Individual corners">
                    <Square size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <PropInput label="TL" value={individualCorners.tl} onChange={(v) => { const c = { ...individualCorners, tl: v }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} />
                    <PropInput label="TR" value={individualCorners.tr} onChange={(v) => { const c = { ...individualCorners, tr: v }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} />
                    <PropInput label="BL" value={individualCorners.bl} onChange={(v) => { const c = { ...individualCorners, bl: v }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} />
                    <PropInput label="BR" value={individualCorners.br} onChange={(v) => { const c = { ...individualCorners, br: v }; setIndividualCorners(c); onIndividualCornerChange?.(c) }} min={0} />
                  </div>
                  <button onClick={() => { setShowIndividualCorners(false); const avg = Math.round((individualCorners.tl + individualCorners.tr + individualCorners.br + individualCorners.bl) / 4); onCornerRadiusChange(avg) }} className="text-xxs text-canvas-accent hover:underline">Uniform radius</button>
                </>
              )}
            </div>
          </Section>
        )}

        {/* Appearance */}
        <Section title="Appearance">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xxs text-canvas-text-secondary w-12">Opacity</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={objectProps.opacity ?? 1}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-canvas-border rounded-full accent-canvas-accent"
              />
              <span className="text-xxs text-canvas-text-secondary w-8 text-right">
                {Math.round((objectProps.opacity ?? 1) * 100)}%
              </span>
            </div>
          </div>
        </Section>

        {/* Blend Mode */}
        <Section title="Blend Mode">
          <select value={objectProps.blendMode || 'source-over'} onChange={(e) => onBlendModeChange?.(e.target.value)} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent text-canvas-text">
            {BLEND_MODES.map(mode => (<option key={mode} value={mode}>{BLEND_MODE_LABELS[mode] || mode}</option>))}
          </select>
        </Section>

        {/* Fill */}
        <Section title="Fill">
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setFillType('solid')}
              className={`flex-1 text-xxs py-1 rounded-md border ${fillType === 'solid' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`}
            >
              Solid
            </button>
            <button
              onClick={() => setFillType('gradient')}
              className={`flex-1 text-xxs py-1 rounded-md border ${fillType === 'gradient' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`}
            >
              Gradient
            </button>
            <button
              onClick={() => onFillChange('transparent')}
              className="flex-1 text-xxs py-1 rounded-md border bg-canvas-bg border-canvas-border text-canvas-text-secondary"
            >
              None
            </button>
          </div>
          {fillType === 'solid' ? (
            <ColorPicker color={fillColor} onChange={onFillChange} />
          ) : (
            <div className="space-y-2">
              <ColorPicker
                color={gradientColor1}
                onChange={(c) => {
                  setGradientColor1(c)
                  onGradientChange({ type: 'linear', colorStops: { '0': c, '1': gradientColor2 } })
                }}
                label="Start"
              />
              <ColorPicker
                color={gradientColor2}
                onChange={(c) => {
                  setGradientColor2(c)
                  onGradientChange({ type: 'linear', colorStops: { '0': gradientColor1, '1': c } })
                }}
                label="End"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => onGradientChange({ type: 'linear', colorStops: { '0': gradientColor1, '1': gradientColor2 } })}
                  className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover"
                >
                  Linear
                </button>
                <button
                  onClick={() => onGradientChange({ type: 'radial', colorStops: { '0': gradientColor1, '1': gradientColor2 } })}
                  className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover"
                >
                  Radial
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Stroke */}
        <Section title="Stroke">
          <div className="space-y-2">
            <ColorPicker
              color={objectProps.stroke || '#000000'}
              onChange={(c) => onStrokeChange(c, objectProps.strokeWidth || 1)}
            />
            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <span className="text-xxs text-canvas-text-tertiary">Width</span>
                <input
                  type="number"
                  value={objectProps.strokeWidth || 0}
                  onChange={(e) => onStrokeChange(objectProps.stroke || '#000000', parseFloat(e.target.value) || 0)}
                  min={0}
                  className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1 focus:outline-none focus:border-canvas-accent text-canvas-text mt-0.5"
                />
              </div>
              <div>
                <span className="text-xxs text-canvas-text-tertiary">Position</span>
                <select value={objectProps.strokePosition || 'center'} onChange={(e) => onStrokePositionChange?.(e.target.value as 'center' | 'inside' | 'outside')} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1 focus:outline-none focus:border-canvas-accent text-canvas-text mt-0.5">
                  <option value="center">Center</option>
                  <option value="inside">Inside</option>
                  <option value="outside">Outside</option>
                </select>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onStrokeDashChange([])} className={`flex-1 text-xxs py-1 rounded-md border ${!objectProps.strokeDashArray || objectProps.strokeDashArray.length === 0 ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border'}`}>Solid</button>
              <button onClick={() => onStrokeDashChange([5, 5])} className={`flex-1 text-xxs py-1 rounded-md border ${objectProps.strokeDashArray?.length === 2 && objectProps.strokeDashArray[0] === 5 ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border'}`}>Dashed</button>
              <button onClick={() => onStrokeDashChange([2, 2])} className={`flex-1 text-xxs py-1 rounded-md border ${objectProps.strokeDashArray?.length === 2 && objectProps.strokeDashArray[0] === 2 ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border'}`}>Dotted</button>
            </div>
          </div>
        </Section>

        {/* Effects (Drop Shadow, Inner Shadow, Layer Blur) */}
        <Section title="Effects">
          <div className="space-y-2">
            <div className="flex gap-1">
              <button onClick={() => setEffectType('drop-shadow')} className={`flex-1 text-xxs py-1 rounded-md border ${effectType === 'drop-shadow' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`}>Drop Shadow</button>
              <button onClick={() => setEffectType('inner-shadow')} className={`flex-1 text-xxs py-1 rounded-md border ${effectType === 'inner-shadow' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`}>Inner Shadow</button>
              <button onClick={() => setEffectType('layer-blur')} className={`flex-1 text-xxs py-1 rounded-md border ${effectType === 'layer-blur' ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary'}`}>Blur</button>
            </div>
            {effectType === 'drop-shadow' && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={shadowEnabled} onChange={(e) => { setShadowEnabled(e.target.checked); if (e.target.checked) { onShadowChange(shadowConfig) } else { onShadowRemove() } }} className="w-3.5 h-3.5 rounded accent-canvas-accent" />
                  <span className="text-xs text-canvas-text-secondary">Enable drop shadow</span>
                </label>
                {shadowEnabled && (
                  <>
                    <ColorPicker color={shadowConfig.color} onChange={(c) => { setShadowConfig(cfg => ({ ...cfg, color: c })); onShadowChange({ ...shadowConfig, color: c }) }} label="Color" />
                    <PropInput label="Blur" value={shadowConfig.blur} onChange={(v) => { setShadowConfig(c => ({ ...c, blur: v })); onShadowChange({ ...shadowConfig, blur: v }) }} min={0} />
                    <div className="grid grid-cols-2 gap-2">
                      <PropInput label="X" value={shadowConfig.offsetX} onChange={(v) => { setShadowConfig(c => ({ ...c, offsetX: v })); onShadowChange({ ...shadowConfig, offsetX: v }) }} />
                      <PropInput label="Y" value={shadowConfig.offsetY} onChange={(v) => { setShadowConfig(c => ({ ...c, offsetY: v })); onShadowChange({ ...shadowConfig, offsetY: v }) }} />
                    </div>
                  </>
                )}
              </>
            )}
            {effectType === 'inner-shadow' && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={innerShadowEnabled} onChange={(e) => { setInnerShadowEnabled(e.target.checked); if (e.target.checked) { onInnerShadowChange?.(innerShadowConfig) } else { onShadowRemove() } }} className="w-3.5 h-3.5 rounded accent-canvas-accent" />
                  <span className="text-xs text-canvas-text-secondary">Enable inner shadow</span>
                </label>
                {innerShadowEnabled && (
                  <>
                    <PropInput label="Blur" value={innerShadowConfig.blur} onChange={(v) => { setInnerShadowConfig(c => ({ ...c, blur: v })); onInnerShadowChange?.({ ...innerShadowConfig, blur: v }) }} min={0} />
                    <div className="grid grid-cols-2 gap-2">
                      <PropInput label="X" value={innerShadowConfig.offsetX} onChange={(v) => { setInnerShadowConfig(c => ({ ...c, offsetX: v })); onInnerShadowChange?.({ ...innerShadowConfig, offsetX: v }) }} />
                      <PropInput label="Y" value={innerShadowConfig.offsetY} onChange={(v) => { setInnerShadowConfig(c => ({ ...c, offsetY: v })); onInnerShadowChange?.({ ...innerShadowConfig, offsetY: v }) }} />
                    </div>
                  </>
                )}
              </>
            )}
            {effectType === 'layer-blur' && (
              <div className="flex items-center gap-2">
                <span className="text-xxs text-canvas-text-secondary w-10">Blur</span>
                <input type="range" min="0" max="100" step="1" value={objectProps.blurAmount || 0} onChange={(e) => onBlurChange?.(parseInt(e.target.value))} className="flex-1 h-1.5 bg-canvas-border rounded-full accent-canvas-accent" />
                <span className="text-xxs text-canvas-text-secondary w-8 text-right">{objectProps.blurAmount || 0}</span>
              </div>
            )}
          </div>
        </Section>

        {/* Image controls */}
        {isImage && (
          <Section title="Image">
            <div className="space-y-2">
              <button onClick={() => onFlatten?.()} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover transition-colors">
                <Sparkles size={14} /> Flatten / Rasterize
              </button>
            </div>
          </Section>
        )}

        {/* Text Properties */}
        {isText && (
          <>
            <Section title="Typography">
              <div className="space-y-2">
                <select
                  value={objectProps.fontFamily || 'Inter'}
                  onChange={(e) => onTextPropertyChange('fontFamily', e.target.value)}
                  className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent"
                >
                  {['Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Palatino', 'Garamond', 'Comic Sans MS', 'Impact', 'Lucida Console', 'Tahoma'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={objectProps.fontWeight || 'normal'}
                    onChange={(e) => onTextPropertyChange('fontWeight', e.target.value)}
                    className="text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-canvas-accent"
                  >
                    <option value="normal">Regular</option>
                    <option value="bold">Bold</option>
                    <option value="100">Thin</option>
                    <option value="200">Extra Light</option>
                    <option value="300">Light</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra Bold</option>
                    <option value="900">Black</option>
                  </select>
                  <PropInput
                    label="Size"
                    value={objectProps.fontSize || 20}
                    onChange={(v) => onTextPropertyChange('fontSize', v)}
                    min={1}
                  />
                </div>

                <div className="flex gap-1">
                  <TextStyleBtn
                    icon={<Bold size={14} />}
                    active={objectProps.fontWeight === 'bold' || objectProps.fontWeight === '700'}
                    onClick={() => onTextPropertyChange('fontWeight', objectProps.fontWeight === 'bold' ? 'normal' : 'bold')}
                    title="Bold"
                  />
                  <TextStyleBtn
                    icon={<Italic size={14} />}
                    active={objectProps.fontStyle === 'italic'}
                    onClick={() => onTextPropertyChange('fontStyle', objectProps.fontStyle === 'italic' ? 'normal' : 'italic')}
                    title="Italic"
                  />
                  <TextStyleBtn
                    icon={<Underline size={14} />}
                    active={objectProps.underline}
                    onClick={() => onTextPropertyChange('underline', !objectProps.underline)}
                    title="Underline"
                  />
                  <TextStyleBtn
                    icon={<Strikethrough size={14} />}
                    active={objectProps.linethrough}
                    onClick={() => onTextPropertyChange('linethrough', !objectProps.linethrough)}
                    title="Strikethrough"
                  />
                </div>

                <div className="flex gap-1">
                  <TextStyleBtn icon={<AlignLeft size={14} />} active={objectProps.textAlign === 'left'} onClick={() => onTextPropertyChange('textAlign', 'left')} title="Align left" />
                  <TextStyleBtn icon={<AlignCenter size={14} />} active={objectProps.textAlign === 'center'} onClick={() => onTextPropertyChange('textAlign', 'center')} title="Align center" />
                  <TextStyleBtn icon={<AlignRight size={14} />} active={objectProps.textAlign === 'right'} onClick={() => onTextPropertyChange('textAlign', 'right')} title="Align right" />
                  <TextStyleBtn icon={<AlignJustify size={14} />} active={objectProps.textAlign === 'justify'} onClick={() => onTextPropertyChange('textAlign', 'justify')} title="Justify" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <PropInput
                    label="Line H"
                    value={objectProps.lineHeight || 1.2}
                    onChange={(v) => onTextPropertyChange('lineHeight', v)}
                    step={0.1}
                    min={0.5}
                    max={5}
                  />
                  <PropInput
                    label="Spacing"
                    value={objectProps.charSpacing || 0}
                    onChange={(v) => onTextPropertyChange('charSpacing', v)}
                  />
                </div>
              </div>
            </Section>
          </>
        )}

        {/* Per-Object Export */}
        <Section title="Export Selected">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-xxs text-canvas-text-tertiary">Scale</span>
                <select value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-1.5 py-1 focus:outline-none focus:border-canvas-accent text-canvas-text mt-0.5">
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                </select>
              </div>
              <div className="flex-1">
                <span className="text-xxs text-canvas-text-tertiary">Format</span>
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-1.5 py-1 focus:outline-none focus:border-canvas-accent text-canvas-text mt-0.5">
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>
            </div>
            <button onClick={() => onExportSelected?.(exportFormat, exportScale)} className="flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs bg-canvas-accent text-white hover:bg-canvas-accent/90 transition-colors">
              <Download size={14} /> Export Selection
            </button>
          </div>
        </Section>

        {/* Order & Transform */}
        <Section title="Order">
          <div className="grid grid-cols-4 gap-1">
            <OrderBtn icon={<ArrowUpToLine size={14} />} onClick={onBringToFront} title="Bring to front" />
            <OrderBtn icon={<ArrowUp size={14} />} onClick={onBringForward} title="Bring forward" />
            <OrderBtn icon={<ArrowDown size={14} />} onClick={onSendBackward} title="Send backward" />
            <OrderBtn icon={<ArrowDownToLine size={14} />} onClick={onSendToBack} title="Send to back" />
          </div>
        </Section>

        {/* Lock */}
        <Section title="Lock">
          <button
            onClick={() => onLock(!objectProps.locked)}
            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border text-xs transition-colors ${
              objectProps.locked
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover'
            }`}
          >
            {objectProps.locked ? <Lock size={14} /> : <Unlock size={14} />}
            {objectProps.locked ? 'Locked' : 'Unlocked'}
          </button>
        </Section>
      </div>
    </div>
  )
}

// Sub-components
function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xxs font-semibold text-canvas-text-tertiary uppercase tracking-wider mb-1.5">{title}</h3>
      {children}
    </div>
  )
}

function PropInput({ label, value, onChange, min, max, step }: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xxs text-canvas-text-tertiary w-6 flex-shrink-0">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step || 1}
        className="w-full text-xs bg-canvas-bg border border-canvas-border rounded-lg px-2 py-1 focus:outline-none focus:border-canvas-accent text-canvas-text"
      />
    </div>
  )
}

function AlignBtn({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-md bg-canvas-bg hover:bg-canvas-hover border border-canvas-border text-canvas-text-secondary hover:text-canvas-text transition-colors"
      title={title}
    >
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}

function TextStyleBtn({ icon, active, onClick, title }: { icon: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-1.5 rounded-md border transition-colors ${
        active ? 'bg-canvas-accent text-white border-canvas-accent' : 'bg-canvas-bg border-canvas-border text-canvas-text-secondary hover:bg-canvas-hover'
      }`}
      title={title}
    >
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}

function OrderBtn({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-md bg-canvas-bg hover:bg-canvas-hover border border-canvas-border text-canvas-text-secondary hover:text-canvas-text transition-colors"
      title={title}
    >
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}
