import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { exportToPNG, exportToSVG, exportToJSON } from '../../utils/exportHelpers';

export default function ExportModal() {
  const { state, dispatch, canvasRef } = useAppContext();
  const [format, setFormat] = useState<'png' | 'svg' | 'json'>('png');
  const [quality, setQuality] = useState(1);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [exportArea, setExportArea] = useState<'all' | 'selected'>('all');

  if (!state.showExportModal) return null;

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    switch (format) {
      case 'png':
        exportToPNG(canvas, quality, includeBackground, exportArea === 'selected');
        break;
      case 'svg':
        exportToSVG(canvas);
        break;
      case 'json':
        exportToJSON(canvas);
        break;
    }
    dispatch({ type: 'SHOW_TOAST', message: 'Exported successfully' });
    dispatch({ type: 'HIDE_EXPORT_MODAL' });
  };

  const close = () => dispatch({ type: 'HIDE_EXPORT_MODAL' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={close}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[#2c2c2c] rounded-lg p-6 w-[400px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">Export Design</h2>
          <button className="text-[#a0a0a0] hover:text-white cursor-pointer" onClick={close}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[#a0a0a0] text-xs font-semibold uppercase block mb-2">Format</label>
            <div className="space-y-2">
              {([
                { value: 'png' as const, label: 'PNG', desc: 'Export as PNG image' },
                { value: 'svg' as const, label: 'SVG', desc: 'Export as SVG vector' },
                { value: 'json' as const, label: 'JSON', desc: 'Export as JSON (re-importable)' },
              ]).map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-2 rounded hover:bg-[#333333] cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="accent-[#7c5cfc]"
                  />
                  <div>
                    <span className="text-white text-sm font-medium">{opt.label}</span>
                    <p className="text-[#a0a0a0] text-xs">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {format === 'png' && (
            <div>
              <label className="text-[#a0a0a0] text-xs font-semibold uppercase block mb-2">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-sm h-8 rounded px-2 w-full focus:border-[#7c5cfc] focus:outline-none cursor-pointer"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </div>
          )}

          {format !== 'json' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="accent-[#7c5cfc]"
              />
              <span className="text-white text-sm">Include background</span>
            </label>
          )}

          <div>
            <label className="text-[#a0a0a0] text-xs font-semibold uppercase block mb-2">Export Area</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="area"
                  checked={exportArea === 'all'}
                  onChange={() => setExportArea('all')}
                  className="accent-[#7c5cfc]"
                />
                <span className="text-white text-sm">Entire canvas</span>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer ${state.selectedObjectIds.length === 0 ? 'opacity-30' : ''}`}>
                <input
                  type="radio"
                  name="area"
                  checked={exportArea === 'selected'}
                  onChange={() => setExportArea('selected')}
                  disabled={state.selectedObjectIds.length === 0}
                  className="accent-[#7c5cfc]"
                />
                <span className="text-white text-sm">Selected objects only</span>
              </label>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 bg-[#7c5cfc] text-white rounded-md py-2.5 text-sm font-medium hover:bg-[#6a4de0] transition-colors cursor-pointer"
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
