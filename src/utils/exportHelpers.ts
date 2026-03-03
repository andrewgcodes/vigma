import { Canvas } from 'fabric';

export function exportToPNG(canvas: Canvas, multiplier: number, includeBackground: boolean) {
  const origBg = canvas.backgroundColor;
  if (!includeBackground) {
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
  }
  const dataURL = canvas.toDataURL({
    format: 'png',
    multiplier,
  });
  if (!includeBackground) {
    canvas.backgroundColor = origBg;
    canvas.renderAll();
  }
  const link = document.createElement('a');
  link.download = 'vigma-design.png';
  link.href = dataURL;
  link.click();
}

export function exportToSVG(canvas: Canvas, includeBackground: boolean) {
  const origBg = canvas.backgroundColor;
  if (!includeBackground) {
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
  }
  const svg = canvas.toSVG();
  if (!includeBackground) {
    canvas.backgroundColor = origBg;
    canvas.renderAll();
  }
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'vigma-design.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(canvas: Canvas) {
  const json = JSON.stringify(canvas.toObject(['customId', 'name', 'selectable', 'evented', 'customType', 'locked']));
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'vigma-design.json';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
