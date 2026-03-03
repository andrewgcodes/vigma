'use client';

import React, { useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useStore } from '@/store/useStore';
import { historyManager } from '@/utils/history';

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
  shadow: string;
  type: string;
}

const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Monaco',
  'system-ui',
];

export default function PropertiesPanel({ fabricRef }: PropertiesPanelProps) {
  const { selectedObjectIds } = useStore();
  const [props, setProps] = useState<ObjectProps | null>(null);

  const readProps = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active) {
      setProps(null);
      return;
    }

    setProps({
      left: Math.round(active.left ?? 0),
      top: Math.round(active.top ?? 0),
      width: Math.round((active.width ?? 0) * (active.scaleX ?? 1)),
      height: Math.round((active.height ?? 0) * (active.scaleY ?? 1)),
      angle: Math.round(active.angle ?? 0),
      opacity: Math.round((active.opacity ?? 1) * 100),
      fill: (typeof active.fill === 'string' ? active.fill : '#000000'),
      stroke: (typeof active.stroke === 'string' ? active.stroke : ''),
      strokeWidth: active.strokeWidth ?? 0,
      rx: (active as fabric.Rect).rx ?? 0,
      ry: (active as fabric.Rect).ry ?? 0,
      fontSize: (active as fabric.Textbox).fontSize ?? 20,
      fontFamily: (active as fabric.Textbox).fontFamily ?? 'Inter',
      fontWeight: String((active as fabric.Textbox).fontWeight ?? 'normal'),
      textAlign: (active as fabric.Textbox).textAlign ?? 'left',
      shadow: '',
      type: active.type ?? '',
    });
  }, [fabricRef]);

  useEffect(() => {
    readProps();
  }, [selectedObjectIds, readProps]);

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

  const updateProp = (key: string, value: number | string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    if (key === 'opacity') {
      active.set('opacity', (value as number) / 100);
    } else if (key === 'width') {
      // Adjust scaleX to achieve the desired visual width
      const intrinsicWidth = active.width ?? 1;
      active.set('scaleX', (value as number) / intrinsicWidth);
    } else if (key === 'height') {
      // Adjust scaleY to achieve the desired visual height
      const intrinsicHeight = active.height ?? 1;
      active.set('scaleY', (value as number) / intrinsicHeight);
    } else {
      active.set(key as keyof fabric.FabricObject, value);
    }

    active.setCoords();
    canvas.renderAll();
    readProps();
    historyManager.saveState();
  };

  if (!props || selectedObjectIds.length === 0) {
    return (
      <div className="fixed right-4 top-20 z-40 w-64">
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 p-4">
          <p className="text-xs text-gray-400 text-center py-8">
            Select an object to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const isText = ['textbox', 'i-text', 'text'].includes(props.type);
  const isRect = props.type === 'rect';

  return (
    <div className="fixed right-4 top-20 z-40 w-64">
      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 overflow-hidden">
        {/* Position & Size */}
        <div className="p-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Transform</p>
          <div className="grid grid-cols-2 gap-2">
            <PropInput label="X" value={props.left} onChange={(v) => updateProp('left', v)} />
            <PropInput label="Y" value={props.top} onChange={(v) => updateProp('top', v)} />
            <PropInput label="W" value={props.width} onChange={(v) => updateProp('width', v)} />
            <PropInput label="H" value={props.height} onChange={(v) => updateProp('height', v)} />
            <PropInput label="R" value={props.angle} onChange={(v) => updateProp('angle', v)} suffix="°" />
            {isRect && (
              <PropInput label="↻" value={Math.round(props.rx)} onChange={(v) => { updateProp('rx', v); updateProp('ry', v); }} />
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="p-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Appearance</p>
          <div className="space-y-2.5">
            {/* Fill */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-10 font-medium">Fill</span>
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="color"
                  value={props.fill || '#000000'}
                  onChange={(e) => updateProp('fill', e.target.value)}
                  className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={props.fill || ''}
                  onChange={(e) => updateProp('fill', e.target.value)}
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Stroke */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-10 font-medium">Stroke</span>
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="color"
                  value={props.stroke || '#000000'}
                  onChange={(e) => updateProp('stroke', e.target.value)}
                  className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  type="number"
                  value={props.strokeWidth}
                  onChange={(e) => updateProp('strokeWidth', parseInt(e.target.value) || 0)}
                  className="w-14 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  min={0}
                  max={50}
                />
              </div>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-10 font-medium">Alpha</span>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={props.opacity}
                  onChange={(e) => updateProp('opacity', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-gray-500 w-8 text-right font-mono">{props.opacity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {isText && (
          <div className="p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Typography</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Font</span>
                <select
                  value={props.fontFamily}
                  onChange={(e) => updateProp('fontFamily', e.target.value)}
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Size</span>
                <input
                  type="number"
                  value={props.fontSize}
                  onChange={(e) => updateProp('fontSize', parseInt(e.target.value) || 12)}
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  min={8}
                  max={200}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Weight</span>
                <select
                  value={props.fontWeight}
                  onChange={(e) => updateProp('fontWeight', e.target.value)}
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                >
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10 font-medium">Align</span>
                <div className="flex-1 flex gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateProp('textAlign', align)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                        props.textAlign === align
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PropInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-400 font-medium w-3">{label}</span>
      <div className="relative flex-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}
