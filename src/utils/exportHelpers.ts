import type { Canvas } from 'fabric';

export function exportToPNG(canvas: Canvas, multiplier: number, includeBackground: boolean, selectedOnly: boolean): void {
  const opts: Record<string, unknown> = {
    format: 'png',
    multiplier,
  };
  if (!includeBackground) {
    opts.backgroundColor = undefined;
  }
  
  let dataURL: string;
  if (selectedOnly && canvas.getActiveObjects().length > 0) {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      dataURL = activeObj.toDataURL(opts as Parameters<typeof activeObj.toDataURL>[0]);
    } else {
      dataURL = canvas.toDataURL(opts as Parameters<typeof canvas.toDataURL>[0]);
    }
  } else {
    dataURL = canvas.toDataURL(opts as Parameters<typeof canvas.toDataURL>[0]);
  }

  const link = document.createElement('a');
  link.download = 'vigma-design.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToSVG(canvas: Canvas): void {
  const svg = canvas.toSVG();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'vigma-design.svg';
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(canvas: Canvas): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = JSON.stringify((canvas as any).toJSON(['objectId', 'customName', 'selectable', 'evented', 'name']), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'vigma-design.json';
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
