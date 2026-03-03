'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';

interface LayersPanelProps {
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
}

export default function LayersPanel({
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
}: LayersPanelProps) {
  const { layers, selectedIds, leftPanelOpen, setLeftPanelOpen } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!leftPanelOpen) {
    return (
      <button
        onClick={() => setLeftPanelOpen(true)}
        className="fixed left-4 top-4 z-40 bg-white rounded-xl shadow-lg shadow-black/5 border border-gray-200/60 p-2.5 hover:bg-gray-50 transition-colors"
        title="Show Layers"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </button>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rect':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
      case 'circle':
      case 'ellipse':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'triangle':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l10 18H2L12 2z" />
          </svg>
        );
      case 'i-text':
      case 'text':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        );
      case 'path':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        );
      case 'image':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        );
      case 'group':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="8" height="8" rx="1" />
            <rect x="14" y="14" width="8" height="8" rx="1" />
          </svg>
        );
      case 'line':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="19" x2="19" y2="5" />
          </svg>
        );
      case 'polygon':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      default:
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed left-4 top-4 bottom-20 z-40 w-56 bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-200/60 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Layers</h2>
        <button
          onClick={() => setLeftPanelOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto py-1">
        {layers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-400">No objects yet</p>
            <p className="text-xs text-gray-300 mt-1">Draw something to see layers</p>
          </div>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.id}
              className={`
                layer-item flex items-center gap-2 px-3 py-1.5 cursor-pointer group
                ${selectedIds.includes(layer.id) ? 'selected bg-blue-50' : ''}
              `}
              onClick={() => onSelectLayer(layer.id)}
              onDoubleClick={() => {
                setEditingId(layer.id);
                setEditName(layer.name);
              }}
            >
              <span className={`flex-shrink-0 ${!layer.visible ? 'opacity-30' : 'text-gray-400'}`}>
                {getTypeIcon(layer.type)}
              </span>

              {editingId === layer.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => {
                    onRenameLayer(layer.id, editName);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRenameLayer(layer.id, editName);
                      setEditingId(null);
                    }
                    if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  className="flex-1 text-xs bg-white border border-blue-300 rounded px-1 py-0.5 outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`flex-1 text-xs truncate ${
                    !layer.visible ? 'text-gray-300' : selectedIds.includes(layer.id) ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}
                >
                  {layer.name}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className={`p-0.5 rounded ${layer.visible ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300'}`}
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  className={`p-0.5 rounded ${!layer.locked ? 'text-gray-400 hover:text-gray-600' : 'text-orange-400'}`}
                  title={layer.locked ? 'Unlock' : 'Lock'}
                >
                  {layer.locked ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
