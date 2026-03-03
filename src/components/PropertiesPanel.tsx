'use client';

import React, { useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useStore } from '@/store/useStore';
import { historyManager } from '@/utils/history';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  FlipHorizontal2,
  FlipVertical2,
  ChevronsUp,
  ArrowUp,
  ArrowDown,
  ChevronsDown,
  Crop,
} from 'lucide-react';

interface PropertiesPanelProps {
  fabricRef: React.RefObject<fabric.Canvas | null>;
}

interface ObjectProps {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rx: number;
  ry: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: string;
  type: string;
  fontStyle: string;
  underline: boolean;
  linethrough: boolean;
  lineHeight: number;
  charSpacing: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  flipX: boolean;
  flipY: boolean;
  fillType: 'solid' | 'linear' | 'radial';
  gradientColor1: string;
  gradientColor2: string;
  isImage: boolean;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

const FONT_FAMILIES = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
  'Courier New', 'Verdana', 'Trebuchet MS', 'Monaco', 'system-ui',
  'Garamond', 'Palatino', 'Futura', 'Gill Sans',
];

export default function PropertiesPanel({ fabricRef }: PropertiesPanelProps) {
  const { selectedObjectIds } = useStore();
  const [props, setProps] = useState<ObjectProps | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const readProps = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) { setProps(null); return; }

    const shadow = active.shadow as fabric.Shadow | null;
    const fill = active.fill;
    let fillType: 'solid' | 'linear' | 'radial' = 'solid';
    let gradientColor1 = '#000000';
    let gradientColor2 = '#ffffff';
    let fillStr = '#000000';

    if (fill && typeof fill === 'object' && 'colorStops' in fill) {
      const grad = fill as fabric.Gradient<'linear' | 'radial'>;
      fillType = grad.type === 'radial' ? 'radial' : 'linear';
      const stops = grad.colorStops || [];
      gradientColor1 = stops[0]?.color || '#000000';
      gradientColor2 = stops[stops.length - 1]?.color || '#ffffff';
      fillStr = gradientColor1;
    } else {
      fillStr = typeof fill === 'string' ? fill : '#000000';
    }

    const textObj = active as fabric.Textbox;
    const rectObj = active as fabric.Rect;
    const imgObj = active as fabric.FabricImage;

    setProps({
      left: Math.round(active.left ?? 0),
      top: Math.round(active.top ?? 0),
      width: Math.round((active.width ?? 0) * (active.scaleX ?? 1)),
      height: Math.round((active.height ?? 0) * (active.scaleY ?? 1)),
      angle: Math.round(active.angle ?? 0),
      opacity: Math.round((active.opacity ?? 1) * 100),
      fill: fillStr,
      stroke: typeof active.stroke === 'string' ? active.stroke : '',
      strokeWidth: active.strokeWidth ?? 0,
      rx: rectObj.rx ?? 0,
      ry: rectObj.ry ?? 0,
      fontSize: textObj.fontSize ?? 20,
      fontFamily: textObj.fontFamily ?? 'Inter',
      fontWeight: String(textObj.fontWeight ?? 'normal'),
      textAlign: textObj.textAlign ?? 'left',
      type: active.type ?? '',
      fontStyle: textObj.fontStyle ?? 'normal',
      underline: textObj.underline ?? false,
      linethrough: textObj.linethrough ?? false,
      lineHeight: textObj.lineHeight ?? 1.16,
      charSpacing: textObj.charSpacing ?? 0,
      shadowColor: shadow?.color ?? '#000000',
      shadowBlur: shadow?.blur ?? 0,
      shadowOffsetX: shadow?.offsetX ?? 0,
      shadowOffsetY: shadow?.offsetY ?? 0,
      flipX: active.flipX ?? false,
      flipY: active.flipY ?? false,
      fillType, gradientColor1, gradientColor2,
      isImage: active.type === 'image',
      cropX: imgObj.cropX ?? 0,
      cropY: imgObj.cropY ?? 0,
      cropWidth: imgObj.width ?? 0,
      cropHeight: imgObj.height ?? 0,
    });
  }, [fabricRef]);

  useEffect(() => { readProps(); }, [selectedObjectIds, readProps]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const handler = () => readProps();
    canvas.on('object:modified', handler);
    canvas.on('object:scaling', handler);
    canvas.on('object:moving', handler);
    canvas.on('object:rotating', handler);
    return () => {
      canvas.off('object:modified', handler);
      canvas.off('object:scaling', handler);
      canvas.off('object:moving', handler);
      canvas.off('object:rotating', handler);
    };
  }, [fabricRef, readProps]);

  const updateProp = (key: string, value: number | string | boolean, skipHistory = false) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    if (key === 'opacity') {
      active.set('opacity', (value as number) / 100);
    } else if (key === 'width') {
      active.set('scaleX', (value as number) / (active.width || 1));
    } else if (key === 'height') {
      active.set('scaleY', (value as number) / (active.height || 1));
    } else {
      active.set(key as keyof fabric.FabricObject, value);
    }
    active.setCoords();
    canvas.renderAll();
    readProps();
    if (!skipHistory) historyManager.saveState();
  };

  const updateShadow = (sp: { color?: string; blur?: number; offsetX?: number; offsetY?: number }) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const cur = active.shadow as fabric.Shadow | null;
    active.set('shadow', new fabric.Shadow({
      color: sp.color ?? cur?.color ?? '#000000',
      blur: sp.blur ?? cur?.blur ?? 0,
      offsetX: sp.offsetX ?? cur?.offsetX ?? 0,
      offsetY: sp.offsetY ?? cur?.offsetY ?? 0,
    }));
    canvas.renderAll();
    readProps();
    historyManager.saveState();
  };

  const removeShadow = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.set('shadow', undefined);
    canvas.renderAll();
    readProps();
    historyManager.saveState();
  };

  const applyGradient = (type: 'linear' | 'radial', color1: string, color2: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const w = active.width ?? 100;
    const h = active.height ?? 100;
    const gradient = new fabric.Gradient({
      type,
      coords: type === 'linear'
        ? { x1: 0, y1: 0, x2: w, y2: h }
        : { x1: w / 2, y1: h / 2, r1: 0, x2: w / 2, y2: h / 2, r2: w / 2 },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
      ],
    });
    active.set('fill', gradient);
    canvas.renderAll();
    readProps();
    historyManager.saveState();
  };

  const setSolidFill = (color: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.set('fill', color);
    canvas.renderAll();
    readProps();
    historyManager.saveState();
  };

  const handleFlip = (axis: 'x' | 'y') => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.set(axis === 'x' ? 'flipX' : 'flipY', axis === 'x' ? !active.flipX : !active.flipY);
    canvas.renderAll();
    historyManager.saveState();
    readProps();
  };

  const handleOrdering = (action: 'front' | 'forward' | 'backward' | 'back') => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    switch (action) {
      case 'front': canvas.bringObjectToFront(active); break;
      case 'forward': canvas.bringObjectForward(active); break;
      case 'backward': canvas.sendObjectBackwards(active); break;
      case 'back': canvas.sendObjectToBack(active); break;
    }
    canvas.renderAll();
    historyManager.saveState();
  };

  const handleCropApply = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'image') return;
    const img = active as fabric.FabricImage;
    const clipRect = new fabric.Rect({
      left: -(img.width ?? 0) / 2 + (props?.cropX ?? 0),
      top: -(img.height ?? 0) / 2 + (props?.cropY ?? 0),
      width: props?.cropWidth ?? img.width ?? 0,
      height: props?.cropHeight ?? img.height ?? 0,
      absolutePositioned: false,
    });
    img.set('clipPath', clipRect);
    canvas.renderAll();
    historyManager.saveState();
    setIsCropping(false);
    readProps();
  };

  if (!props || selectedObjectIds.length === 0) {
    return (
      <div className="fixed right-4 top-20 z-40 w-64">
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 p-4">
          <p className="text-xs text-gray-400 text-center py-8">Select an object to edit its properties</p>
        </div>
      </div>
    );
  }

  const isText = ['textbox', 'i-text', 'text'].includes(props.type);
  const isRect = props.type === 'rect';

  return (
    <div className="fixed right-4 top-20 z-40 w-64 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 overflow-hidden">
        {/* Transform */}
        <div className="p-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Transform</p>
          <div className="grid grid-cols-2 gap-2">
            <PropInput label="X" value={props.left} onChange={(v) => updateProp('left', v)} />
            <PropInput label="Y" value={props.top} onChange={(v) => updateProp('top', v)} />
            <PropInput label="W" value={props.width} onChange={(v) => updateProp('width', v)} />
            <PropInput label="H" value={props.height} onChange={(v) => updateProp('height', v)} />
            <PropInput label="R" value={props.angle} onChange={(v) => updateProp('angle', v)} suffix="deg" />
            {isRect && (
              <PropInput label="Rd" value={Math.round(props.rx)} onChange={(v) => { updateProp('rx', v, true); updateProp('ry', v); }} />
            )}
          </div>
        </div>

        {/* Arrange */}
        <div className="p-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Arrange</p>
          <div className="flex gap-1">
            <IconButton icon={<FlipHorizontal2 size={14} />} title="Flip H" onClick={() => handleFlip('x')} active={props.flipX} />
            <IconButton icon={<FlipVertical2 size={14} />} title="Flip V" onClick={() => handleFlip('y')} active={props.flipY} />
            <div className="w-px h-6 bg-gray-200 mx-0.5 self-center" />
            <IconButton icon={<ChevronsUp size={14} />} title="To Front" onClick={() => handleOrdering('front')} />
            <IconButton icon={<ArrowUp size={14} />} title="Forward" onClick={() => handleOrdering('forward')} />
            <IconButton icon={<ArrowDown size={14} />} title="Backward" onClick={() => handleOrdering('backward')} />
            <IconButton icon={<ChevronsDown size={14} />} title="To Back" onClick={() => handleOrdering('back')} />
          </div>
        </div>

        {/* Fill */}
        <div className="p-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Fill</p>
          <div className="space-y-2.5">
            <div className="flex gap-1">
              {(['solid', 'linear', 'radial'] as const).map((type) => (
                <button key={type} onClick={() => {
                  if (type === 'solid') setSolidFill(props.gradientColor1 || props.fill || '#4F46E5');
                  else applyGradient(type, props.gradientColor1 || props.fill || '#4F46E5', props.gradientColor2 || '#ffffff');
                }} className={`flex-1 text-[10px] py-1 rounded-md border transition-colors ${props.fillType === type ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            {props.fillType === 'solid' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Color</span>
                <div className="flex-1 flex items-center gap-1.5">
                  <input type="color" value={props.fill || '#000000'} onChange={(e) => setSolidFill(e.target.value)} className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input type="text" value={props.fill || ''} onChange={(e) => setSolidFill(e.target.value)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>
            )}
            {(props.fillType === 'linear' || props.fillType === 'radial') && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-10 font-medium">From</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <input type="color" value={props.gradientColor1} onChange={(e) => applyGradient(props.fillType as 'linear' | 'radial', e.target.value, props.gradientColor2)} className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <input type="text" value={props.gradientColor1} onChange={(e) => applyGradient(props.fillType as 'linear' | 'radial', e.target.value, props.gradientColor2)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-10 font-medium">To</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <input type="color" value={props.gradientColor2} onChange={(e) => applyGradient(props.fillType as 'linear' | 'radial', props.gradientColor1, e.target.value)} className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <input type="text" value={props.gradientColor2} onChange={(e) => applyGradient(props.fillType as 'linear' | 'radial', props.gradientColor1, e.target.value)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stroke */}
        <div className="p-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Stroke</p>
          <div className="flex items-center gap-1.5">
            <input type="color" value={props.stroke || '#000000'} onChange={(e) => updateProp('stroke', e.target.value)} className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
            <input type="number" value={props.strokeWidth} onChange={(e) => updateProp('strokeWidth', parseInt(e.target.value) || 0)} className="w-14 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" min={0} max={50} />
          </div>
        </div>

        {/* Opacity */}
        <div className="p-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Opacity</p>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={100} value={props.opacity} onChange={(e) => updateProp('opacity', parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600" />
            <span className="text-[10px] text-gray-500 w-8 text-right font-mono">{props.opacity}%</span>
          </div>
        </div>

        {/* Shadow */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Shadow</p>
            {props.shadowBlur > 0 && <button onClick={removeShadow} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-10 font-medium">Color</span>
              <input type="color" value={props.shadowColor} onChange={(e) => updateShadow({ color: e.target.value })} className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 mb-0.5">Blur</span>
                <input type="number" value={props.shadowBlur} onChange={(e) => updateShadow({ blur: parseInt(e.target.value) || 0 })} className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-gray-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/20" min={0} max={100} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 mb-0.5">X</span>
                <input type="number" value={props.shadowOffsetX} onChange={(e) => updateShadow({ offsetX: parseInt(e.target.value) || 0 })} className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-gray-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 mb-0.5">Y</span>
                <input type="number" value={props.shadowOffsetY} onChange={(e) => updateShadow({ offsetY: parseInt(e.target.value) || 0 })} className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-gray-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Image Crop */}
        {props.isImage && (
          <div className="p-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Image</p>
            {!isCropping ? (
              <button onClick={() => setIsCropping(true)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700">
                <Crop size={12} /> Crop Image
              </button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <PropInput label="X" value={props.cropX} onChange={(v) => setProps(p => p ? { ...p, cropX: v } : p)} />
                  <PropInput label="Y" value={props.cropY} onChange={(v) => setProps(p => p ? { ...p, cropY: v } : p)} />
                  <PropInput label="W" value={props.cropWidth} onChange={(v) => setProps(p => p ? { ...p, cropWidth: v } : p)} />
                  <PropInput label="H" value={props.cropHeight} onChange={(v) => setProps(p => p ? { ...p, cropHeight: v } : p)} />
                </div>
                <div className="flex gap-1">
                  <button onClick={handleCropApply} className="flex-1 text-xs py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Apply</button>
                  <button onClick={() => setIsCropping(false)} className="flex-1 text-xs py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Typography */}
        {isText && (
          <div className="p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Typography</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Font</span>
                <select value={props.fontFamily} onChange={(e) => updateProp('fontFamily', e.target.value)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                  {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Size</span>
                <input type="number" value={props.fontSize} onChange={(e) => updateProp('fontSize', parseInt(e.target.value) || 12)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" min={8} max={200} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Weight</span>
                <select value={props.fontWeight} onChange={(e) => updateProp('fontWeight', e.target.value)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                  <option value="normal">Regular</option>
                  <option value="bold">Bold</option>
                  <option value="100">Thin</option>
                  <option value="300">Light</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="800">Extra Bold</option>
                  <option value="900">Black</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Style</span>
                <div className="flex gap-0.5">
                  <IconButton icon={<Bold size={13} />} title="Bold" onClick={() => updateProp('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')} active={props.fontWeight === 'bold'} />
                  <IconButton icon={<Italic size={13} />} title="Italic" onClick={() => updateProp('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')} active={props.fontStyle === 'italic'} />
                  <IconButton icon={<Underline size={13} />} title="Underline" onClick={() => updateProp('underline', !props.underline)} active={props.underline} />
                  <IconButton icon={<Strikethrough size={13} />} title="Strikethrough" onClick={() => updateProp('linethrough', !props.linethrough)} active={props.linethrough} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Align</span>
                <div className="flex-1 flex gap-1">
                  {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                    <button key={align} onClick={() => updateProp('textAlign', align)} className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-colors ${props.textAlign === align ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Height</span>
                <input type="number" step={0.1} value={props.lineHeight.toFixed(1)} onChange={(e) => updateProp('lineHeight', parseFloat(e.target.value) || 1.16)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" min={0.5} max={5} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Space</span>
                <input type="number" value={props.charSpacing} onChange={(e) => updateProp('charSpacing', parseInt(e.target.value) || 0)} className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" min={-500} max={2000} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PropInput({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-400 font-medium w-4">{label}</span>
      <div className="relative flex-1">
        <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function IconButton({ icon, title, onClick, active }: { icon: React.ReactNode; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
      {icon}
    </button>
  );
}
