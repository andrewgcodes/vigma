'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { alignObjects, distributeObjects } from '@/utils/canvas-helpers';
import * as fabric from 'fabric';

interface PropertiesPanelProps {
  getActiveObjectProps: () => Record<string, unknown> | null;
  setObjectProperty: (property: string, value: unknown) => void;
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  onGroup: () => void;
  onUngroup: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const fontFamilies = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Comic Sans MS',
  'Impact',
];

export default function PropertiesPanel({
  getActiveObjectProps,
  setObjectProperty,
  canvasRef,
  onGroup,
  onUngroup,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
}: PropertiesPanelProps) {
  const { selectedIds, rightPanelOpen, setRightPanelOpen, fillColor, setFillColor, strokeColor, setStrokeColor } = useStore();
  const [props, setProps] = useState<Record<string, unknown> | null>(null);

  const refreshProps = useCallback(() => {
    const p = getActiveObjectProps();
    setProps(p);
  }, [getActiveObjectProps]);

  useEffect(() => {
    refreshProps();
  }, [selectedIds, refreshProps]);

  // Poll for property changes (when dragging/resizing)
  useEffect(() => {
    const interval = setInterval(refreshProps, 100);
    return () => clearInterval(interval);
  }, [refreshProps]);

  if (!rightPanelOpen) {
    return (
      <button
        onClick={() => setRightPanelOpen(true)}
        className="fixed right-4 top-4 z-40 bg-white rounded-xl shadow-lg shadow-black/5 border border-gray-200/60 p-2.5 hover:bg-gray-50 transition-colors"
        title="Show Properties"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    );
  }

  const isText = props?.type === 'i-text' || props?.type === 'text' || props?.type === 'textbox';
  const isRect = props?.type === 'rect';

  return (
    <div className="fixed right-4 top-4 bottom-20 z-40 w-64 bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {props ? (props.name as string) : 'Design'}
        </h2>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!props ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-400">Select an object to edit properties</p>
          </div>
        ) : (
          <>
            {/* Position & Size */}
            <div className="panel-section p-4">
              <h3 className="prop-label mb-2">Position</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 mb-0.5 block">X</label>
                  <input
                    type="number"
                    className="prop-input"
                    value={props.left as number}
                    onChange={(e) => setObjectProperty('left', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 mb-0.5 block">Y</label>
                  <input
                    type="number"
                    className="prop-input"
                    value={props.top as number}
                    onChange={(e) => setObjectProperty('top', Number(e.target.value))}
                  />
                </div>
              </div>

              <h3 className="prop-label mb-2 mt-3">Dimensions</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 mb-0.5 block">W</label>
                  <input
                    type="number"
                    className="prop-input"
                    value={props.width as number}
                    onChange={(e) => {
                      const newWidth = Number(e.target.value);
                      const currentWidth = props.width as number;
                      if (currentWidth > 0) {
                        setObjectProperty('scaleX', newWidth / ((props.width as number) / ((props as Record<string, unknown>).scaleX as number || 1)));
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 mb-0.5 block">H</label>
                  <input
                    type="number"
                    className="prop-input"
                    value={props.height as number}
                    onChange={(e) => {
                      const newHeight = Number(e.target.value);
                      const currentHeight = props.height as number;
                      if (currentHeight > 0) {
                        setObjectProperty('scaleY', newHeight / ((props.height as number) / ((props as Record<string, unknown>).scaleY as number || 1)));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-[10px] text-gray-400 mb-0.5 block">Rotation</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="prop-input"
                      value={props.angle as number}
                      onChange={(e) => setObjectProperty('angle', Number(e.target.value))}
                    />
                    <span className="text-[10px] text-gray-400">°</span>
                  </div>
                </div>
                {isRect && (
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Radius</label>
                    <input
                      type="number"
                      className="prop-input"
                      value={props.rx as number}
                      min={0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setObjectProperty('rx', val);
                        setObjectProperty('ry', val);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Appearance */}
            <div className="panel-section p-4">
              <h3 className="prop-label mb-2">Appearance</h3>

              {/* Opacity */}
              <div className="mb-3">
                <label className="text-[10px] text-gray-400 mb-1 block">Opacity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={props.opacity as number}
                    onChange={(e) => setObjectProperty('opacity', Number(e.target.value) / 100)}
                    className="flex-1 h-1 accent-blue-500"
                  />
                  <span className="text-[11px] text-gray-500 w-8 text-right">{props.opacity as number}%</span>
                </div>
              </div>

              {/* Fill */}
              <div className="mb-3">
                <label className="text-[10px] text-gray-400 mb-1 block">Fill</label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={(props.fill as string) || '#000000'}
                      onChange={(e) => {
                        setObjectProperty('fill', e.target.value);
                        setFillColor(e.target.value);
                      }}
                      className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    className="prop-input flex-1"
                    value={(props.fill as string) || ''}
                    onChange={(e) => {
                      setObjectProperty('fill', e.target.value);
                      setFillColor(e.target.value);
                    }}
                  />
                </div>
              </div>

              {/* Stroke */}
              <div className="mb-3">
                <label className="text-[10px] text-gray-400 mb-1 block">Stroke</label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={(props.stroke as string) || '#000000'}
                      onChange={(e) => {
                        setObjectProperty('stroke', e.target.value);
                        setStrokeColor(e.target.value);
                      }}
                      className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    className="prop-input flex-1"
                    value={(props.stroke as string) || ''}
                    onChange={(e) => {
                      setObjectProperty('stroke', e.target.value);
                      setStrokeColor(e.target.value);
                    }}
                  />
                </div>
              </div>

              {/* Stroke Width */}
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">Stroke Width</label>
                <input
                  type="number"
                  className="prop-input w-20"
                  value={props.strokeWidth as number}
                  min={0}
                  onChange={(e) => setObjectProperty('strokeWidth', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Typography (text only) */}
            {isText && (
              <div className="panel-section p-4">
                <h3 className="prop-label mb-2">Typography</h3>

                <div className="mb-2">
                  <label className="text-[10px] text-gray-400 mb-0.5 block">Font</label>
                  <select
                    className="prop-input"
                    value={props.fontFamily as string}
                    onChange={(e) => setObjectProperty('fontFamily', e.target.value)}
                  >
                    {fontFamilies.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
                    <input
                      type="number"
                      className="prop-input"
                      value={props.fontSize as number}
                      min={1}
                      onChange={(e) => setObjectProperty('fontSize', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
                    <select
                      className="prop-input"
                      value={props.fontWeight as string}
                      onChange={(e) => setObjectProperty('fontWeight', e.target.value)}
                    >
                      <option value="normal">Regular</option>
                      <option value="bold">Bold</option>
                      <option value="100">Thin</option>
                      <option value="300">Light</option>
                      <option value="500">Medium</option>
                      <option value="600">Semibold</option>
                      <option value="800">ExtraBold</option>
                    </select>
                  </div>
                </div>

                {/* Text alignment */}
                <div className="mb-2">
                  <label className="text-[10px] text-gray-400 mb-1 block">Alignment</label>
                  <div className="flex gap-1">
                    {[
                      { value: 'left', icon: 'M3 6h18M3 12h10M3 18h14' },
                      { value: 'center', icon: 'M6 6h12M3 12h18M6 18h12' },
                      { value: 'right', icon: 'M3 6h18M11 12h10M7 18h14' },
                    ].map(({ value, icon }) => (
                      <button
                        key={value}
                        onClick={() => setObjectProperty('textAlign', value)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          props.textAlign === value
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d={icon} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font style buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setObjectProperty(
                        'fontStyle',
                        props.fontStyle === 'italic' ? 'normal' : 'italic'
                      )
                    }
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      props.fontStyle === 'italic'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <em>I</em>
                  </button>
                  <button
                    onClick={() =>
                      setObjectProperty(
                        'underline',
                        !(props as Record<string, unknown>).underline
                      )
                    }
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      (props as Record<string, unknown>).underline
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <u>U</u>
                  </button>
                  <button
                    onClick={() =>
                      setObjectProperty(
                        'linethrough',
                        !(props as Record<string, unknown>).linethrough
                      )
                    }
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      (props as Record<string, unknown>).linethrough
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <s>S</s>
                  </button>
                </div>
              </div>
            )}

            {/* Alignment */}
            <div className="panel-section p-4">
              <h3 className="prop-label mb-2">Align & Distribute</h3>
              <div className="flex gap-1 mb-2">
                {[
                  { action: 'left' as const, title: 'Align Left', icon: 'M4 22V2M8 6h12M8 12h8M8 18h10' },
                  { action: 'center-h' as const, title: 'Align Center', icon: 'M12 22V2M6 6h12M8 12h8M6 18h12' },
                  { action: 'right' as const, title: 'Align Right', icon: 'M20 22V2M4 6h12M8 12h8M6 18h10' },
                  { action: 'top' as const, title: 'Align Top', icon: 'M2 4h20M6 8v12M12 8v8M18 8v10' },
                  { action: 'center-v' as const, title: 'Align Middle', icon: 'M2 12h20M6 6v12M12 8v8M18 6v12' },
                  { action: 'bottom' as const, title: 'Align Bottom', icon: 'M2 20h20M6 4v12M12 8v8M18 6v10' },
                ].map(({ action, title, icon }) => (
                  <button
                    key={action}
                    onClick={() => {
                      if (canvasRef.current) {
                        alignObjects(canvasRef.current, action);
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title={title}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d={icon} />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (canvasRef.current) distributeObjects(canvasRef.current, 'horizontal');
                  }}
                  className="flex-1 py-1.5 text-[10px] text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Distribute H
                </button>
                <button
                  onClick={() => {
                    if (canvasRef.current) distributeObjects(canvasRef.current, 'vertical');
                  }}
                  className="flex-1 py-1.5 text-[10px] text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Distribute V
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="panel-section p-4">
              <h3 className="prop-label mb-2">Actions</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onGroup}
                  className="py-1.5 text-[11px] text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Group
                </button>
                <button
                  onClick={onUngroup}
                  className="py-1.5 text-[11px] text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Ungroup
                </button>
                <button
                  onClick={onBringToFront}
                  className="py-1.5 text-[11px] text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  To Front
                </button>
                <button
                  onClick={onSendToBack}
                  className="py-1.5 text-[11px] text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  To Back
                </button>
                <button
                  onClick={onBringForward}
                  className="py-1.5 text-[11px] text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Forward
                </button>
                <button
                  onClick={onSendBackward}
                  className="py-1.5 text-[11px] text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Backward
                </button>
                <button
                  onClick={onDuplicate}
                  className="py-1.5 text-[11px] text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Duplicate
                </button>
                <button
                  onClick={onDelete}
                  className="py-1.5 text-[11px] text-red-500 rounded-lg hover:bg-red-50 border border-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
