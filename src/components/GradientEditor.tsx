'use client';

import React, { useState, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';

interface GradientStop {
  offset: number;
  color: string;
}

interface GradientEditorProps {
  stops: GradientStop[];
  angle: number;
  type: 'linear' | 'radial';
  onChange: (stops: GradientStop[], angle: number, type: 'linear' | 'radial') => void;
}

export default function GradientEditor({ stops, angle, type, onChange }: GradientEditorProps) {
  const [selectedStop, setSelectedStop] = useState(0);
  const [editingColor, setEditingColor] = useState(false);

  const gradientCSS = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
    : `radial-gradient(circle, ${stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`;

  const handleStopColorChange = useCallback((color: string) => {
    const newStops = [...stops];
    newStops[selectedStop] = { ...newStops[selectedStop], color };
    onChange(newStops, angle, type);
  }, [stops, selectedStop, angle, type, onChange]);

  const handleStopOffsetChange = useCallback((index: number, offset: number) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], offset: Math.max(0, Math.min(1, offset)) };
    onChange(newStops, angle, type);
  }, [stops, angle, type, onChange]);

  const addStop = useCallback(() => {
    const newStops = [...stops, { offset: 0.5, color: '#888888' }];
    newStops.sort((a, b) => a.offset - b.offset);
    onChange(newStops, angle, type);
  }, [stops, angle, type, onChange]);

  const removeStop = useCallback((index: number) => {
    if (stops.length <= 2) return;
    const newStops = stops.filter((_, i) => i !== index);
    onChange(newStops, angle, type);
    if (selectedStop >= newStops.length) setSelectedStop(newStops.length - 1);
  }, [stops, selectedStop, angle, type, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => onChange(stops, angle, 'linear')}
          className={`px-3 py-1 text-2xs rounded-md transition-colors ${
            type === 'linear' ? 'bg-canvas-accent text-white' : 'bg-canvas-hover text-canvas-text-secondary'
          }`}
        >
          Linear
        </button>
        <button
          onClick={() => onChange(stops, angle, 'radial')}
          className={`px-3 py-1 text-2xs rounded-md transition-colors ${
            type === 'radial' ? 'bg-canvas-accent text-white' : 'bg-canvas-hover text-canvas-text-secondary'
          }`}
        >
          Radial
        </button>
      </div>

      {/* Gradient preview */}
      <div
        className="h-8 rounded-lg border border-canvas-border cursor-pointer"
        style={{ background: gradientCSS }}
      />

      {/* Stops */}
      <div className="space-y-2">
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedStop(i); setEditingColor(!editingColor || selectedStop !== i); }}
              className={`w-5 h-5 rounded border cursor-pointer ${
                selectedStop === i ? 'ring-2 ring-canvas-accent' : 'border-canvas-border'
              }`}
              style={{ backgroundColor: stop.color }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={stop.offset * 100}
              onChange={(e) => handleStopOffsetChange(i, parseInt(e.target.value) / 100)}
              className="flex-1 h-1 accent-canvas-accent"
            />
            <span className="text-2xs text-canvas-text-secondary w-8">
              {Math.round(stop.offset * 100)}%
            </span>
            {stops.length > 2 && (
              <button
                onClick={() => removeStop(i)}
                className="text-canvas-text-secondary hover:text-red-500 text-xs"
              >
                x
              </button>
            )}
          </div>
        ))}
      </div>

      {editingColor && (
        <div className="mt-2">
          <HexColorPicker
            color={stops[selectedStop]?.color || '#000000'}
            onChange={handleStopColorChange}
            style={{ width: '100%', height: '120px' }}
          />
        </div>
      )}

      <button
        onClick={addStop}
        className="w-full text-2xs text-canvas-accent hover:text-canvas-accent-hover py-1"
      >
        + Add Color Stop
      </button>

      {type === 'linear' && (
        <div className="flex items-center gap-2">
          <span className="text-2xs text-canvas-text-secondary">Angle</span>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => onChange(stops, parseInt(e.target.value), type)}
            className="flex-1 h-1 accent-canvas-accent"
          />
          <span className="text-2xs text-canvas-text-secondary w-8">{angle}°</span>
        </div>
      )}
    </div>
  );
}
