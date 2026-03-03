'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PanelRightClose,
  PanelRight,
  Settings2,
  Paintbrush,
  Move,
  RotateCw,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import type { Canvas, FabricObject } from 'fabric';

interface PropertiesPanelProps {
  canvas: React.RefObject<Canvas | null>;
}

interface ObjProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  rx: number;
  ry: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: string;
  scaleX: number;
  scaleY: number;
}

const defaultProps: ObjProps = {
  fill: '#4A90D9',
  stroke: '#000000',
  strokeWidth: 0,
  opacity: 1,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  angle: 0,
  rx: 0,
  ry: 0,
  fontSize: 24,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  textAlign: 'left',
  scaleX: 1,
  scaleY: 1,
};

export default function PropertiesPanel({ canvas }: PropertiesPanelProps) {
  const { selectedObjectIds, activeTool, brushSize, setBrushSize, brushColor, setBrushColor } =
    useEditorStore();
  const [collapsed, setCollapsed] = useState(false);
  const [props, setProps] = useState<ObjProps>(defaultProps);
  const [objType, setObjType] = useState<string>('');

  const getSelectedObject = useCallback((): FabricObject | null => {
    if (!canvas.current) return null;
    return canvas.current.getActiveObject() || null;
  }, [canvas]);

  const updateProps = useCallback(() => {
    const obj = getSelectedObject();
    if (!obj) {
      setObjType('');
      return;
    }

    setObjType(obj.type || '');

    const typed = obj as FabricObject & {
      rx?: number;
      ry?: number;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      textAlign?: string;
      radius?: number;
    };

    setProps({
      fill: (typeof obj.fill === 'string' ? obj.fill : '#000000'),
      stroke: (typeof obj.stroke === 'string' ? obj.stroke : '#000000'),
      strokeWidth: obj.strokeWidth || 0,
      opacity: obj.opacity ?? 1,
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
      height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
      angle: Math.round(obj.angle || 0),
      rx: typed.rx || 0,
      ry: typed.ry || 0,
      fontSize: typed.fontSize || 24,
      fontFamily: typed.fontFamily || 'Arial',
      fontWeight: (typed.fontWeight as string) || 'normal',
      textAlign: typed.textAlign || 'left',
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
    });
  }, [getSelectedObject]);

  useEffect(() => {
    updateProps();
  }, [selectedObjectIds, updateProps]);

  // Listen for object modifications
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;

    const handler = () => updateProps();
    c.on('object:modified', handler);
    c.on('object:scaling', handler);
    c.on('object:moving', handler);
    c.on('object:rotating', handler);
    c.on('selection:created', handler);
    c.on('selection:updated', handler);
    c.on('selection:cleared', handler);

    return () => {
      c.off('object:modified', handler);
      c.off('object:scaling', handler);
      c.off('object:moving', handler);
      c.off('object:rotating', handler);
      c.off('selection:created', handler);
      c.off('selection:updated', handler);
      c.off('selection:cleared', handler);
    };
  }, [canvas, updateProps]);

  const applyProp = (key: string, value: string | number) => {
    const obj = getSelectedObject();
    if (!obj || !canvas.current) return;

    const typed = obj as FabricObject & {
      rx?: number;
      ry?: number;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      textAlign?: string;
    };

    if (key === 'width') {
      const newScale = (value as number) / (obj.width || 1);
      obj.scaleX = newScale;
    } else if (key === 'height') {
      const newScale = (value as number) / (obj.height || 1);
      obj.scaleY = newScale;
    } else if (key === 'rx' || key === 'ry') {
      typed[key] = value as number;
    } else if (key === 'fontSize') {
      typed.fontSize = value as number;
    } else if (key === 'fontFamily') {
      typed.fontFamily = value as string;
    } else if (key === 'fontWeight') {
      typed.fontWeight = value as string;
    } else if (key === 'textAlign') {
      typed.textAlign = value as string;
    } else {
      obj.set(key as keyof FabricObject, value as never);
    }

    obj.setCoords();
    canvas.current.renderAll();
    updateProps();
  };

  const isTextObject = ['textbox', 'i-text', 'text'].includes(objType);
  const isRectObject = objType === 'rect';
  const hasSelection = selectedObjectIds.length > 0;

  if (collapsed) {
    return (
      <div className="w-10 bg-panel-bg border-l border-panel-border flex flex-col items-center pt-3">
        <button
          onClick={() => setCollapsed(false)}
          className="tool-btn"
          title="Show Properties"
        >
          <PanelRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-panel-bg border-l border-panel-border flex flex-col select-none overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Properties
          </span>
        </div>
        <button onClick={() => setCollapsed(true)} className="tool-btn w-6 h-6">
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Drawing tool properties */}
      {activeTool === 'draw' && (
        <div className="panel-section">
          <div className="panel-label flex items-center gap-1">
            <Paintbrush size={12} />
            Brush Settings
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary w-14">Color</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-6"
              />
              <span className="text-xs text-text-muted">{brushColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary w-14">Size</label>
              <input
                type="range"
                min={1}
                max={50}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-text-muted w-6 text-right">{brushSize}</span>
            </div>
          </div>
        </div>
      )}

      {!hasSelection && activeTool !== 'draw' && (
        <div className="flex flex-col items-center justify-center h-40 text-text-muted text-xs">
          <Settings2 size={24} className="mb-2 opacity-30" />
          Select an object to edit
        </div>
      )}

      {hasSelection && (
        <>
          {/* Position & Size */}
          <div className="panel-section">
            <div className="panel-label flex items-center gap-1">
              <Move size={12} />
              Transform
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-text-muted">X</label>
                <input
                  type="number"
                  value={props.left}
                  onChange={(e) => applyProp('left', Number(e.target.value))}
                  className="panel-input"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">Y</label>
                <input
                  type="number"
                  value={props.top}
                  onChange={(e) => applyProp('top', Number(e.target.value))}
                  className="panel-input"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">W</label>
                <input
                  type="number"
                  value={props.width}
                  onChange={(e) => applyProp('width', Number(e.target.value))}
                  className="panel-input"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">H</label>
                <input
                  type="number"
                  value={props.height}
                  onChange={(e) => applyProp('height', Number(e.target.value))}
                  className="panel-input"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted flex items-center gap-1">
                  <RotateCw size={10} /> Angle
                </label>
                <input
                  type="number"
                  value={props.angle}
                  onChange={(e) => applyProp('angle', Number(e.target.value))}
                  className="panel-input"
                />
              </div>
            </div>
          </div>

          {/* Fill & Stroke */}
          <div className="panel-section">
            <div className="panel-label flex items-center gap-1">
              <Paintbrush size={12} />
              Appearance
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary w-14">Fill</label>
                <input
                  type="color"
                  value={props.fill}
                  onChange={(e) => applyProp('fill', e.target.value)}
                  className="w-8 h-6"
                />
                <input
                  type="text"
                  value={props.fill}
                  onChange={(e) => applyProp('fill', e.target.value)}
                  className="panel-input flex-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary w-14">Stroke</label>
                <input
                  type="color"
                  value={props.stroke}
                  onChange={(e) => applyProp('stroke', e.target.value)}
                  className="w-8 h-6"
                />
                <input
                  type="text"
                  value={props.stroke}
                  onChange={(e) => applyProp('stroke', e.target.value)}
                  className="panel-input flex-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary w-14">Width</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={props.strokeWidth}
                  onChange={(e) => applyProp('strokeWidth', Number(e.target.value))}
                  className="panel-input flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary w-14">Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={props.opacity}
                  onChange={(e) => applyProp('opacity', Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-text-muted w-8 text-right">
                  {Math.round(props.opacity * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Border Radius for Rectangles */}
          {isRectObject && (
            <div className="panel-section">
              <div className="panel-label">Border Radius</div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary w-14">Radius</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={props.rx}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    applyProp('rx', val);
                    applyProp('ry', val);
                  }}
                  className="panel-input flex-1"
                />
              </div>
            </div>
          )}

          {/* Text Properties */}
          {isTextObject && (
            <div className="panel-section">
              <div className="panel-label flex items-center gap-1">
                <Type size={12} />
                Text
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-text-muted">Font Family</label>
                  <select
                    value={props.fontFamily}
                    onChange={(e) => applyProp('fontFamily', e.target.value)}
                    className="panel-input"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Impact">Impact</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="monospace">Monospace</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-text-muted">Size</label>
                    <input
                      type="number"
                      min={8}
                      max={200}
                      value={props.fontSize}
                      onChange={(e) => applyProp('fontSize', Number(e.target.value))}
                      className="panel-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Weight</label>
                    <select
                      value={props.fontWeight}
                      onChange={(e) => applyProp('fontWeight', e.target.value)}
                      className="panel-input"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="100">Thin</option>
                      <option value="300">Light</option>
                      <option value="500">Medium</option>
                      <option value="700">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted">Alignment</label>
                  <div className="flex gap-1 mt-1">
                    {['left', 'center', 'right', 'justify'].map((align) => (
                      <button
                        key={align}
                        onClick={() => applyProp('textAlign', align)}
                        className={`flex-1 py-1 text-xs rounded ${
                          props.textAlign === align
                            ? 'bg-accent text-white'
                            : 'bg-canvas-bg text-text-secondary hover:bg-toolbar-hover'
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
        </>
      )}
    </div>
  );
}

function Type({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" x2="15" y1="20" y2="20" />
      <line x1="12" x2="12" y1="4" y2="20" />
    </svg>
  );
}
