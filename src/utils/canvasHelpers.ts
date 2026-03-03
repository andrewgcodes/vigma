import { Canvas, FabricObject, Polygon, Point } from 'fabric';

export function getCanvasObjects(canvas: Canvas): FabricObject[] {
  return canvas.getObjects().filter((obj) => (obj as FabricObject & { name?: string }).name !== 'artboard' && (obj as FabricObject & { name?: string }).name !== 'grid' && (obj as FabricObject & { name?: string }).name !== 'pen-preview');
}

export function findObjectById(canvas: Canvas, id: string): FabricObject | undefined {
  return canvas.getObjects().find((obj) => (obj as FabricObject & { customId?: string }).customId === id);
}

export function createStarPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  const step = Math.PI / points;
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    result.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return result;
}

export function createStarPolygon(left: number, top: number, width: number, height: number, fill: string, stroke: string, strokeWidth: number): Polygon {
  const outerR = Math.min(width, height) / 2;
  const innerR = outerR * 0.4;
  const points = createStarPoints(0, 0, outerR, innerR, 5);
  const star = new Polygon(points.map(p => new Point(p.x, p.y)), {
    left,
    top,
    fill,
    stroke,
    strokeWidth,
    originX: 'center',
    originY: 'center',
  });
  return star;
}

let objectCounters: Record<string, number> = {};

export function getNextObjectName(type: string): string {
  const key = type.charAt(0).toUpperCase() + type.slice(1);
  objectCounters[key] = (objectCounters[key] || 0) + 1;
  return `${key} ${objectCounters[key]}`;
}

export function resetObjectCounters() {
  objectCounters = {};
}
