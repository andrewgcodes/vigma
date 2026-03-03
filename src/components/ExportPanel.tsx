'use client';

import React from 'react';
import { useDesignStore } from '@/store/useDesignStore';
import { Download, Image, FileText, FileJson, File } from 'lucide-react';

interface ExportPanelProps {
  onExport: (format: string, scale?: number) => void;
}

const exportFormats = [
  { id: 'png', label: 'PNG', icon: <Image size={16} />, description: 'Raster image format' },
  { id: 'svg', label: 'SVG', icon: <FileText size={16} />, description: 'Vector format' },
  { id: 'pdf', label: 'PDF', icon: <File size={16} />, description: 'Document format' },
  { id: 'json', label: 'JSON', icon: <FileJson size={16} />, description: 'Design file' },
];

const scaleOptions = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
];

export default function ExportPanel({ onExport }: ExportPanelProps) {
  const exportFormat = useDesignStore((s) => s.exportFormat);
  const exportScale = useDesignStore((s) => s.exportScale);
  const setExportFormat = useDesignStore((s) => s.setExportFormat);
  const setExportScale = useDesignStore((s) => s.setExportScale);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-canvas-border">
        <Download size={14} className="text-canvas-text-secondary" />
        <span className="text-xs font-medium text-canvas-text">Export</span>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Format selection */}
        <div>
          <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-2 block">Format</span>
          <div className="grid grid-cols-2 gap-2">
            {exportFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => setExportFormat(format.id as any)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  exportFormat === format.id
                    ? 'border-canvas-accent bg-canvas-accent/5 text-canvas-accent'
                    : 'border-canvas-border text-canvas-text hover:bg-canvas-hover'
                }`}
              >
                {format.icon}
                <div className="text-left">
                  <div className="text-xs font-medium">{format.label}</div>
                  <div className="text-2xs opacity-60">{format.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
        {(exportFormat === 'png' || exportFormat === 'pdf') && (
          <div>
            <span className="text-2xs text-canvas-text-secondary uppercase tracking-wider mb-2 block">Scale</span>
            <div className="flex gap-1">
              {scaleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExportScale(option.value)}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                    exportScale === option.value
                      ? 'bg-canvas-accent text-white'
                      : 'bg-canvas-hover text-canvas-text-secondary hover:text-canvas-text'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Export button */}
        <button
          onClick={() => onExport(exportFormat, exportScale)}
          className="w-full py-2.5 bg-canvas-accent text-white text-sm font-medium rounded-xl hover:bg-canvas-accent-hover transition-colors shadow-sm"
        >
          Export {exportFormat.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
