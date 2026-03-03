import { Canvas } from 'fabric';

export function serializeCanvas(canvas: Canvas): string {
  return JSON.stringify(canvas.toObject(['customId', 'name', 'selectable', 'evented', 'customType', 'locked']));
}
