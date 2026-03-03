'use client';

import React, { useState, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';
import { useDesignStore } from '@/store/useDesignStore';
import ColorPicker from './ColorPicker';
import GradientEditor from './GradientEditor';
import { applyGradient, alignObjects, distributeObjects } from '@/utils/canvas-helpers';
import {
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical,
  AlignCenterVertical, AlignEndVertical, FlipHorizontal, FlipVertical,
  RotateCcw, Trash2, Copy, Lock, Unlock, Eye, EyeOff,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft as TextAlignLeft, AlignCenter as TextAlignCenter,
  AlignRight as TextAlignRight, AlignJustify,
  Maximize2, Minimize2, X,
} from 'lucide-react';

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null;
  onSaveHistory: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onLock: () => void;
}

const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light',
  'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity',
];

const fontFamilies = [
  'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
  'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
  'SF Pro Display', 'SF Pro Text', 'Roboto', 'Open Sans', 'Lato',
  'Montserrat', 'Poppins', 'Playfair Display', 'Source Code Pro',
];

export default function PropertiesPanel({
  canvas, onSaveHistory, onDelete, onDuplicate,
  onGroup, onUngroup, onBringForward, onSendBackward,
  onBringToFront, onSendToBack, onFlipH, onFlipV, onLock,
}: PropertiesPanelProps) {
  const store = useDesignStore();
  const [activeObj, setActiveObj] = useState<fabric.FabricObject | null>(null);
  const [objProps, setObjProps] = useState<Record<string, any>>({});
  const [fillType, setFillType] = useState<'solid' | 'gradient'>('solid');
  const [gradientStops, setGradientStops] = useState([
    { offset: 0, color: '#000000' },
    { offset: 1, color: '#ffffff' },
  ]);
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [, forceUpdate] = useState(0);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowProps, setShadowProps] = useState({ color: '#000000', blur: 10, offsetX: 0, offsetY: 4 });

  const refreshProps = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    setActiveObj(obj || null);
    if (!obj) {
      setObjProps({});
      return;
    }

    const isText = obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox';
    const props: Record<string, any> = {
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
      height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
      angle: Math.round(obj.angle || 0),
      opacity: Math.round((obj.opacity || 1) * 100),
      fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
      stroke: obj.stroke || 'transparent',
      strokeWidth: obj.strokeWidth || 0,
      rx: (obj as any).rx || 0,
      ry: (obj as any).ry || 0,
      name: (obj as any).customName || obj.type,
      type: obj.type,
      locked: obj.lockMovementX,
      visible: obj.visible,
      flipX: obj.flipX,
      flipY: obj.flipY,
      isText,
    };

    if (isText) {
      const textObj = obj as fabric.IText;
      props.fontSize = textObj.fontSize || 16;
      props.fontFamily = textObj.fontFamily || 'Inter';
      props.fontWeight = textObj.fontWeight || '400';
      props.fontStyle = textObj.fontStyle || 'normal';
      props.textAlign = textObj.textAlign || 'left';
      props.lineHeight = textObj.lineHeight || 1.2;
      props.charSpacing = textObj.charSpacing || 0;
      props.underline = textObj.underline || false;
      props.linethrough = textObj.linethrough || false;
    }

    if (obj.fill instanceof fabric.Gradient) {
      setFillType('gradient');
      const grad = obj.fill;
      setGradientStops(grad.colorStops?.map((s: any) => ({ offset: s.offset, color: s.color })) || []);
      setGradientType(grad.type === 'radial' ? 'radial' : 'linear');
    } else {
      setFillType('solid');
    }

    if (obj.shadow) {
      setShadowEnabled(true);
      const s = obj.shadow as fabric.Shadow;
      setShadowProps({
        color: s.color || '#000000',
        blur: s.blur || 10,
        offsetX: s.offsetX || 0,
        offsetY: s.offsetY || 4,
      });
    } else {
      setShadowEnabled(false);
    }

    setObjProps(props);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    const handler = () => { refreshProps(); forceUpdate(n => n + 1); };
    canvas.on('selection:created', handler);
    canvas.on('selection:updated', handler);
    canvas.on('selection:cleared', handler);
    canvas.on('object:modified', handler);
    canvas.on('object:scaling', handler);
    canvas.on('object:moving', handler);
    canvas.on('object:rotating', handler);
    return () => {
      canvas.off('selection:created', handler);
      canvas.off('selection:updated', handler);
      canvas.off('selection:cleared', handler);
      canvas.off('object:modified', handler);
      canvas.off('object:scaling', handler);
      canvas.off('object:moving', handler);
      canvas.off('object:rotating', handler);
    };
  }, [canvas, refreshProps]);

  const updateProp = useCallback((key: string, value: any) => {
    if (!canvas || !activeObj) return;

    switch (key) {
      case 'left':
        activeObj.set('left', value);
        break;
      case 'top':
        activeObj.set('top', value);
        break;
      case 'width':
        activeObj.set('scaleX', value / (activeObj.width || 1));
        break;
      case 'height':
        activeObj.set('scaleY', value / (activeObj.height || 1));
        break;
      case 'angle':
        activeObj.set('angle', value);
        break;
      case 'opacity':
        activeObj.set('opacity', value / 100);
        break;
      case 'fill':
        activeObj.set('fill', value);
        store.setFillColor(value);
        break;
      case 'stroke':
        activeObj.set('stroke', value);
        store.setStrokeColor(value);
        break;
      case 'strokeWidth':
        activeObj.set('strokeWidth', value);
        store.setStrokeWidth(value);
        break;
      case 'rx':
      case 'ry':
        (activeObj as any).set('rx', value);
        (activeObj as any).set('ry', value);
        store.setCornerRadius(value);
        break;
      case 'fontSize':
        (activeObj as fabric.IText).set('fontSize', value);
        store.setFontSize(value);
        break;
      case 'fontFamily':
        (activeObj as fabric.IText).set('fontFamily', value);
        store.setFontFamily(value);
        break;
      case 'fontWeight':
        (activeObj as fabric.IText).set('fontWeight', value as any);
        store.setFontWeight(value);
        break;
      case 'fontStyle':
        (activeObj as fabric.IText).set('fontStyle', value);
        store.setFontStyle(value);
        break;
      case 'textAlign':
        (activeObj as fabric.IText).set('textAlign', value);
        store.setTextAlign(value);
        break;
      case 'lineHeight':
        (activeObj as fabric.IText).set('lineHeight', value);
        break;
      case 'charSpacing':
        (activeObj as fabric.IText).set('charSpacing', value);
        break;
      case 'underline':
        (activeObj as fabric.IText).set('underline', value);
        break;
      case 'linethrough':
        (activeObj as fabric.IText).set('linethrough', value);
        break;
    }

    activeObj.setCoords();
    canvas.renderAll();
    refreshProps();
  }, [canvas, activeObj, refreshProps, store]);

  const handleGradientChange = useCallback((stops: any[], angle: number, type: 'linear' | 'radial') => {
    if (!canvas || !activeObj) return;
    setGradientStops(stops);
    setGradientAngle(angle);
    setGradientType(type);
    applyGradient(activeObj, type, stops, angle);
    canvas.renderAll();
  }, [canvas, activeObj]);

  const handleShadowToggle = useCallback(() => {
    if (!canvas || !activeObj) return;
    if (shadowEnabled) {
      activeObj.set('shadow', null);
      setShadowEnabled(false);
    } else {
      activeObj.set('shadow', new fabric.Shadow(shadowProps));
      setShadowEnabled(true);
    }
    canvas.renderAll();
    onSaveHistory();
  }, [canvas, activeObj, shadowEnabled, shadowProps, onSaveHistory]);

  const handleShadowChange = useCallback((key: string, value: any) => {
    if (!canvas || !activeObj) return;
    const newProps = { ...shadowProps, [key]: value };
    setShadowProps(newProps);
    activeObj.set('shadow', new fabric.Shadow(newProps));
    canvas.renderAll();
  }, [canvas, activeObj, shadowProps]);

  const handleAlign = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (!canvas) return;
    const objects = canvas.getActiveObjects();
    if (objects.length < 2) return;
    alignObjects(objects, alignment);
    objects.forEach((o) => o.setCoords());
    canvas.renderAll();
    onSaveHistory();
  }, [canvas, onSaveHistory]);

  const handleDistribute = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!canvas) return;
    const objects = canvas.getActiveObjects();
    if (objects.length < 3) return;
    distributeObjects(objects, direction);
    objects.forEach((o) => o.setCoords());
    canvas.renderAll();
    onSaveHistory();
  }, [canvas, onSaveHistory]);

  if (!activeObj) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-canvas-border">
          <span className="text-xs font-medium text-canvas-text">Design</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-xs text-canvas-text-secondary text-center">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const isMultiSelect = canvas?.getActiveObjects().length! > 1;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border">
        <span className="text-xs font-medium text-canvas-text truncate">
          {isMultiSelect ? `${canvas?.getActiveObjects().length} objects` : objProps.name}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Duplicate">
            <Copy size={14} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-canvas-text-secondary hover:text-red-500" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b border-canvas-border">
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={onBringToFront} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Bring to front">
            <ChevronsUp size={14} />
          </button>
          <button onClick={onBringForward} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Bring forward">
            <ArrowUp size={14} />
          </button>
          <button onClick={onSendBackward} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Send backward">
            <ArrowDown size={14} />
          </button>
          <button onClick={onSendToBack} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Send to back">
            <ChevronsDown size={14} />
          </button>
          <div className="w-px h-5 bg-canvas-border mx-1" />
          <button onClick={onFlipH} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Flip horizontal">
            <FlipHorizontal size={14} />
          </button>
          <button onClick={onFlipV} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Flip vertical">
            <FlipVertical size={14} />
          </button>
          <div className="w-px h-5 bg-canvas-border mx-1" />
          <button onClick={onLock} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title={objProps.locked ? 'Unlock' : 'Lock'}>
            {objProps.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>
      </div>

      {/* Alignment (multi-select) */}
      {isMultiSelect && (
        <div className="px-4 py-3 border-b border-canvas-border">
          <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-2 block">Alignment</span>
          <div className="flex items-center gap-1">
            <button onClick={() => handleAlign('left')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Align left">
              <AlignLeft size={14} />
            </button>
            <button onClick={() => handleAlign('center-h')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Align center">
              <AlignCenter size={14} />
            </button>
            <button onClick={() => handleAlign('right')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Align right">
              <AlignRight size={14} />
            </button>
            <div className="w-px h-5 bg-canvas-border mx-1" />
            <button onClick={() => handleAlign('top')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Align top">
              <AlignStartVertical size={14} />
            </button>
            <button onClick={() => handleAlign('center-v')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Align middle">
              <AlignCenterVertical size={14} />
            </button>
            <button onClick={() => handleAlign('bottom')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Align bottom">
              <AlignEndVertical size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button onClick={() => handleDistribute('horizontal')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Distribute horizontally">
              <AlignHorizontalDistributeCenter size={14} />
            </button>
            <button onClick={() => handleDistribute('vertical')} className="p-1.5 rounded hover:bg-canvas-hover text-canvas-text-secondary" title="Distribute vertically">
              <AlignVerticalDistributeCenter size={14} />
            </button>
            <div className="w-px h-5 bg-canvas-border mx-1" />
            <button onClick={onGroup} className="px-2 py-1 text-2xs rounded hover:bg-canvas-hover text-canvas-text-secondary">
              Group
            </button>
            <button onClick={onUngroup} className="px-2 py-1 text-2xs rounded hover:bg-canvas-hover text-canvas-text-secondary">
              Ungroup
            </button>
          </div>
        </div>
      )}

      {/* Position & Size */}
      <div className="px-4 py-3 border-b border-canvas-border">
        <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-2 block">Position</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-2xs text-canvas-text-secondary">X</label>
            <input
              type="number"
              value={objProps.left || 0}
              onChange={(e) => updateProp('left', parseFloat(e.target.value))}
              onBlur={onSaveHistory}
              className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
            />
          </div>
          <div>
            <label className="text-2xs text-canvas-text-secondary">Y</label>
            <input
              type="number"
              value={objProps.top || 0}
              onChange={(e) => updateProp('top', parseFloat(e.target.value))}
              onBlur={onSaveHistory}
              className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-2xs text-canvas-text-secondary">W</label>
            <input
              type="number"
              value={objProps.width || 0}
              onChange={(e) => updateProp('width', parseFloat(e.target.value))}
              onBlur={onSaveHistory}
              className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
            />
          </div>
          <div>
            <label className="text-2xs text-canvas-text-secondary">H</label>
            <input
              type="number"
              value={objProps.height || 0}
              onChange={(e) => updateProp('height', parseFloat(e.target.value))}
              onBlur={onSaveHistory}
              className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-2xs text-canvas-text-secondary">Rotation</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={objProps.angle || 0}
                onChange={(e) => updateProp('angle', parseFloat(e.target.value))}
                onBlur={onSaveHistory}
                className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
              />
              <span className="text-2xs text-canvas-text-secondary">°</span>
            </div>
          </div>
          {(objProps.type === 'rect') && (
            <div>
              <label className="text-2xs text-canvas-text-secondary">Radius</label>
              <input
                type="number"
                value={objProps.rx || 0}
                min={0}
                onChange={(e) => updateProp('rx', parseFloat(e.target.value))}
                onBlur={onSaveHistory}
                className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Typography */}
      {objProps.isText && (
        <div className="px-4 py-3 border-b border-canvas-border">
          <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-2 block">Typography</span>
          <select
            value={objProps.fontFamily || 'Inter'}
            onChange={(e) => updateProp('fontFamily', e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white mb-2"
          >
            {fontFamilies.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              value={objProps.fontWeight || '400'}
              onChange={(e) => updateProp('fontWeight', e.target.value)}
              className="text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
            >
              <option value="100">Thin</option>
              <option value="200">Extra Light</option>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
              <option value="900">Black</option>
            </select>
            <input
              type="number"
              value={objProps.fontSize || 16}
              onChange={(e) => updateProp('fontSize', parseInt(e.target.value))}
              onBlur={onSaveHistory}
              className="text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
            />
          </div>
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => updateProp('fontWeight', objProps.fontWeight === '700' ? '400' : '700')}
              className={`p-1.5 rounded ${objProps.fontWeight === '700' ? 'bg-canvas-accent/10 text-canvas-accent' : 'hover:bg-canvas-hover text-canvas-text-secondary'}`}
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => updateProp('fontStyle', objProps.fontStyle === 'italic' ? 'normal' : 'italic')}
              className={`p-1.5 rounded ${objProps.fontStyle === 'italic' ? 'bg-canvas-accent/10 text-canvas-accent' : 'hover:bg-canvas-hover text-canvas-text-secondary'}`}
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => updateProp('underline', !objProps.underline)}
              className={`p-1.5 rounded ${objProps.underline ? 'bg-canvas-accent/10 text-canvas-accent' : 'hover:bg-canvas-hover text-canvas-text-secondary'}`}
            >
              <Underline size={14} />
            </button>
            <button
              onClick={() => updateProp('linethrough', !objProps.linethrough)}
              className={`p-1.5 rounded ${objProps.linethrough ? 'bg-canvas-accent/10 text-canvas-accent' : 'hover:bg-canvas-hover text-canvas-text-secondary'}`}
            >
              <Strikethrough size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {['left', 'center', 'right', 'justify'].map((align) => (
              <button
                key={align}
                onClick={() => updateProp('textAlign', align)}
                className={`p-1.5 rounded ${objProps.textAlign === align ? 'bg-canvas-accent/10 text-canvas-accent' : 'hover:bg-canvas-hover text-canvas-text-secondary'}`}
              >
                {align === 'left' && <TextAlignLeft size={14} />}
                {align === 'center' && <TextAlignCenter size={14} />}
                {align === 'right' && <TextAlignRight size={14} />}
                {align === 'justify' && <AlignJustify size={14} />}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-canvas-text-secondary">Line height</label>
              <input
                type="number"
                value={objProps.lineHeight || 1.2}
                step={0.1}
                onChange={(e) => updateProp('lineHeight', parseFloat(e.target.value))}
                className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
              />
            </div>
            <div>
              <label className="text-2xs text-canvas-text-secondary">Letter spacing</label>
              <input
                type="number"
                value={objProps.charSpacing || 0}
                onChange={(e) => updateProp('charSpacing', parseInt(e.target.value))}
                className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Appearance */}
      <div className="px-4 py-3 border-b border-canvas-border">
        <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-2 block">Appearance</span>
        <div className="space-y-3">
          <div>
            <label className="text-2xs text-canvas-text-secondary mb-1 block">Opacity</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={objProps.opacity || 100}
                onChange={(e) => updateProp('opacity', parseInt(e.target.value))}
                onMouseUp={onSaveHistory}
                className="flex-1 h-1 accent-canvas-accent"
              />
              <span className="text-xs text-canvas-text w-8 text-right">{objProps.opacity}%</span>
            </div>
          </div>
          <div>
            <label className="text-2xs text-canvas-text-secondary mb-1 block">Blend Mode</label>
            <select
              value={(activeObj as any)?.globalCompositeOperation || 'source-over'}
              onChange={(e) => {
                activeObj?.set('globalCompositeOperation' as any, e.target.value);
                canvas?.renderAll();
                onSaveHistory();
              }}
              className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
            >
              {blendModes.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fill */}
      <div className="px-4 py-3 border-b border-canvas-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider">Fill</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setFillType('solid');
                if (activeObj && typeof objProps.fill === 'string') {
                  activeObj.set('fill', objProps.fill);
                  canvas?.renderAll();
                }
              }}
              className={`px-2 py-0.5 text-2xs rounded ${fillType === 'solid' ? 'bg-canvas-accent text-white' : 'text-canvas-text-secondary hover:bg-canvas-hover'}`}
            >
              Solid
            </button>
            <button
              onClick={() => setFillType('gradient')}
              className={`px-2 py-0.5 text-2xs rounded ${fillType === 'gradient' ? 'bg-canvas-accent text-white' : 'text-canvas-text-secondary hover:bg-canvas-hover'}`}
            >
              Gradient
            </button>
            <button
              onClick={() => {
                activeObj?.set('fill', 'transparent');
                canvas?.renderAll();
                onSaveHistory();
              }}
              className="px-2 py-0.5 text-2xs rounded text-canvas-text-secondary hover:bg-canvas-hover"
            >
              None
            </button>
          </div>
        </div>
        {fillType === 'solid' ? (
          <ColorPicker
            color={typeof objProps.fill === 'string' ? objProps.fill : '#000000'}
            onChange={(c) => { updateProp('fill', c); onSaveHistory(); }}
          />
        ) : (
          <GradientEditor
            stops={gradientStops}
            angle={gradientAngle}
            type={gradientType}
            onChange={handleGradientChange}
          />
        )}
      </div>

      {/* Stroke */}
      <div className="px-4 py-3 border-b border-canvas-border">
        <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-2 block">Stroke</span>
        <ColorPicker
          color={objProps.stroke === 'transparent' ? '#000000' : (objProps.stroke || '#000000')}
          onChange={(c) => { updateProp('stroke', c); onSaveHistory(); }}
        />
        <div className="mt-2">
          <label className="text-2xs text-canvas-text-secondary">Width</label>
          <input
            type="number"
            value={objProps.strokeWidth || 0}
            min={0}
            onChange={(e) => updateProp('strokeWidth', parseFloat(e.target.value))}
            onBlur={onSaveHistory}
            className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
          />
        </div>
        <div className="mt-2">
          <label className="text-2xs text-canvas-text-secondary">Style</label>
          <div className="flex gap-1 mt-1">
            {[
              { label: 'Solid', value: [] },
              { label: 'Dashed', value: [8, 4] },
              { label: 'Dotted', value: [2, 4] },
            ].map((style) => (
              <button
                key={style.label}
                onClick={() => {
                  activeObj?.set('strokeDashArray', style.value.length ? style.value : undefined);
                  canvas?.renderAll();
                  onSaveHistory();
                }}
                className="px-2 py-1 text-2xs rounded border border-canvas-border hover:bg-canvas-hover text-canvas-text-secondary"
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shadow */}
      <div className="px-4 py-3 border-b border-canvas-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider">Shadow</span>
          <button
            onClick={handleShadowToggle}
            className={`w-8 h-4 rounded-full transition-colors ${shadowEnabled ? 'bg-canvas-accent' : 'bg-gray-200'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${shadowEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {shadowEnabled && (
          <div className="space-y-2">
            <ColorPicker
              color={shadowProps.color}
              onChange={(c) => handleShadowChange('color', c)}
              label="Color"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-2xs text-canvas-text-secondary">X</label>
                <input
                  type="number"
                  value={shadowProps.offsetX}
                  onChange={(e) => handleShadowChange('offsetX', parseInt(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
                />
              </div>
              <div>
                <label className="text-2xs text-canvas-text-secondary">Y</label>
                <input
                  type="number"
                  value={shadowProps.offsetY}
                  onChange={(e) => handleShadowChange('offsetY', parseInt(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
                />
              </div>
              <div>
                <label className="text-2xs text-canvas-text-secondary">Blur</label>
                <input
                  type="number"
                  value={shadowProps.blur}
                  min={0}
                  onChange={(e) => handleShadowChange('blur', parseInt(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 border border-canvas-border rounded-lg focus:outline-none focus:border-canvas-accent bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
