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
  Sun, Moon, Layers
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
}: PropertiesPanelProps) {
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowConfig, setShadowConfig] = useState({ color: 'rgba(0,0,0,0.25)', blur: 10, offsetX: 0, offsetY: 4 })
  const [fillType, setFillType] = useState<'solid' | 'gradient'>('solid')
  const [gradientColor1, setGradientColor1] = useState('#4A90D9')
  const [gradientColor2, setGradientColor2] = useState('#50C878')

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
  const isRect = objectProps.type === 'rect'
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
            <PropInput
              label="R"
              value={objectProps.rx || 0}
              onChange={(v) => onCornerRadiusChange(v)}
              min={0}
            />
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
            <PropInput
              label="Width"
              value={objectProps.strokeWidth || 0}
              onChange={(v) => onStrokeChange(objectProps.stroke || '#000000', v)}
              min={0}
            />
            <div className="flex gap-1">
              <button onClick={() => onStrokeDashChange([])} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border">Solid</button>
              <button onClick={() => onStrokeDashChange([5, 5])} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border">Dashed</button>
              <button onClick={() => onStrokeDashChange([2, 2])} className="flex-1 text-xxs py-1 rounded-md bg-canvas-bg border border-canvas-border">Dotted</button>
            </div>
          </div>
        </Section>

        {/* Shadow */}
        <Section title="Shadow">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shadowEnabled}
                onChange={(e) => {
                  setShadowEnabled(e.target.checked)
                  if (e.target.checked) {
                    onShadowChange(shadowConfig)
                  } else {
                    onShadowRemove()
                  }
                }}
                className="w-3.5 h-3.5 rounded accent-canvas-accent"
              />
              <span className="text-xs text-canvas-text-secondary">Enable shadow</span>
            </label>
            {shadowEnabled && (
              <>
                <PropInput label="Blur" value={shadowConfig.blur} onChange={(v) => { setShadowConfig(c => ({ ...c, blur: v })); onShadowChange({ ...shadowConfig, blur: v }) }} min={0} />
                <div className="grid grid-cols-2 gap-2">
                  <PropInput label="X" value={shadowConfig.offsetX} onChange={(v) => { setShadowConfig(c => ({ ...c, offsetX: v })); onShadowChange({ ...shadowConfig, offsetX: v }) }} />
                  <PropInput label="Y" value={shadowConfig.offsetY} onChange={(v) => { setShadowConfig(c => ({ ...c, offsetY: v })); onShadowChange({ ...shadowConfig, offsetY: v }) }} />
                </div>
              </>
            )}
          </div>
        </Section>

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
