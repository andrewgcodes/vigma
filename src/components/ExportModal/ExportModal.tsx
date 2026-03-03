import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { Canvas } from 'fabric';
import { exportToPNG, exportToSVG, exportToJSON } from '../../utils/exportHelpers';

interface ExportModalProps {
  canvas: Canvas | null;
}

export default function ExportModal({ canvas }: ExportModalProps) {
  const { state, dispatch, showToast } = useAppContext();
  const [format, setFormat] = useState<'png' | 'svg' | 'json'>('png');
  const [quality, setQuality] = useState(1);
  const [includeBackground, setIncludeBackground] = useState(true);

  if (!state.showExportModal) return null;

  const handleExport = () => {
    if (!canvas) return;
    try {
      if (format === 'png') {
        exportToPNG(canvas, quality, includeBackground);
      } else if (format === 'svg') {
        exportToSVG(canvas);
      } else {
        exportToJSON(canvas);
      }
      showToast('Exported successfully');
      dispatch({ type: 'HIDE_EXPORT_MODAL' });
    } catch (err) {
      showToast('Export failed');
    }
  };

  const handleClose = () => {
    dispatch({ type: 'HIDE_EXPORT_MODAL' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-[#2c2c2c] rounded-lg p-6 w-[400px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">Export Design</h2>
          <button className="text-[#a0a0a0] hover:text-white" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs text-[#a0a0a0] uppercase font-semibold">Format</label>
            {(['png', 'svg', 'json'] as const).map((f) => (
              <label key={f} className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="radio"
                  name="format"
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="accent-[#7c5cfc]"
                />
                <span className="text-sm text-[#d0d0d0] uppercase">{f}</span>
                <span className="text-xs text-[#666]">
                  {f === 'png' && '— Export as PNG image'}
                  {f === 'svg' && '— Export as SVG vector'}
                  {f === 'json' && '— Export as JSON (re-importable)'}
                </span>
              </label>
            ))}
          </div>

          {/* Quality (PNG only) */}
          {format === 'png' && (
            <div>
              <label className="text-xs text-[#a0a0a0] uppercase font-semibold block mb-1">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-white text-sm h-8 rounded px-2 focus:border-[#7c5cfc] focus:outline-none"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </div>
          )}

          {/* Include background */}
          {format !== 'json' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="accent-[#7c5cfc]"
              />
              <span className="text-sm text-[#d0d0d0]">Include background</span>
            </label>
          )}

          {/* Export button */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-[#7c5cfc] text-white rounded-md py-2.5 text-sm font-medium hover:bg-[#6a4de0] transition-colors"
            onClick={handleExport}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
