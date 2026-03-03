import type * as fabric from 'fabric';
import { saveAs } from 'file-saver';

export function exportToPNG(canvas: fabric.Canvas, fileName = 'vigma-export') {
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2,
  });
  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = dataURL;
  link.click();
}

export function exportToSVG(canvas: fabric.Canvas, fileName = 'vigma-export') {
  const svg = canvas.toSVG();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, `${fileName}.svg`);
}

export function exportToJSON(canvas: fabric.Canvas, fileName = 'vigma-project') {
  const json = JSON.stringify(canvas.toJSON(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, `${fileName}.json`);
}

export async function importFromJSON(canvas: fabric.Canvas, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        await canvas.loadFromJSON(json);
        canvas.renderAll();
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
