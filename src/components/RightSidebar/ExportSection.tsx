import { useState } from 'react';
import { Download, Plus, Minus } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface ExportSectionProps {
  obj: FabricObject;
}

interface ExportConfig {
  scale: string;
  format: string;
}

export default function ExportSection({ obj }: ExportSectionProps) {
  const { canvasRef, dispatch } = useAppContext();
  const [exports, setExports] = useState<ExportConfig[]>([]);

  const addExport = () => {
    setExports([...exports, { scale: '1x', format: 'PNG' }]);
  };

  const removeExport = (index: number) => {
    setExports(exports.filter((_, i) => i !== index));
  };

  const updateExport = (index: number, field: keyof ExportConfig, value: string) => {
    const newExports = [...exports];
    newExports[index] = { ...newExports[index], [field]: value };
    setExports(newExports);
  };

  const doExport = (config: ExportConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const multiplier = parseInt(config.scale) || 1;
    const format = config.format.toLowerCase();
    const record = obj as unknown as Record<string, unknown>;
    const name = (record.customName as string) || 'export';

    if (format === 'png' || format === 'jpg') {
      // Export selected object only
      const tempCanvas = document.createElement('canvas');
      const bounds = obj.getBoundingRect();
      tempCanvas.width = bounds.width * multiplier;
      tempCanvas.height = bounds.height * multiplier;

      const dataURL = canvas.toDataURL({
        format: format === 'jpg' ? 'jpeg' : 'png',
        multiplier,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      });

      const link = document.createElement('a');
      link.download = `${name}.${format}`;
      link.href = dataURL;
      link.click();
    } else if (format === 'svg') {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${name}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }

    dispatch({ type: 'SHOW_TOAST', message: 'Exported successfully' });
  };

  const record = obj as unknown as Record<string, unknown>;
  const objName = (record.customName as string) || 'Selection';

  return (
    <div>
      <SectionHeader title="Export">
        <button
          className="p-0.5 rounded text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] cursor-pointer"
          onClick={addExport}
          title="Add export"
        >
          <Plus size={12} />
        </button>
      </SectionHeader>
      {exports.length > 0 && (
        <div className="px-3 pb-2 space-y-2">
          {exports.map((exp, i) => (
            <div key={i} className="flex items-center gap-1">
              <select
                value={exp.scale}
                onChange={(e) => updateExport(i, 'scale', e.target.value)}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1 w-16 focus:border-[#7c5cfc] focus:outline-none cursor-pointer"
              >
                <option value="1x">1x</option>
                <option value="2x">2x</option>
                <option value="3x">3x</option>
                <option value="4x">4x</option>
              </select>
              <select
                value={exp.format}
                onChange={(e) => updateExport(i, 'format', e.target.value)}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded px-1 flex-1 focus:border-[#7c5cfc] focus:outline-none cursor-pointer"
              >
                <option value="PNG">PNG</option>
                <option value="JPG">JPG</option>
                <option value="SVG">SVG</option>
              </select>
              <button
                className="p-1 rounded text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] cursor-pointer"
                onClick={() => removeExport(i)}
                title="Remove"
              >
                <Minus size={12} />
              </button>
            </div>
          ))}
          <button
            className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs h-7 rounded hover:border-[#7c5cfc] transition-colors cursor-pointer flex items-center justify-center gap-1"
            onClick={() => exports.forEach(doExport)}
          >
            <Download size={12} />
            Export {objName}
          </button>
        </div>
      )}
    </div>
  );
}
