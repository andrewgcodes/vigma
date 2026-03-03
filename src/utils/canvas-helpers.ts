import * as fabric from 'fabric';

export function createGrid(canvas: fabric.Canvas, gridSize: number): void {
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const lines: fabric.Line[] = [];

  for (let i = 0; i < width / gridSize; i++) {
    const x = i * gridSize;
    lines.push(
      new fabric.Line([x, 0, x, height], {
        stroke: '#e5e7eb',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.5,
      })
    );
  }

  for (let i = 0; i < height / gridSize; i++) {
    const y = i * gridSize;
    lines.push(
      new fabric.Line([0, y, width, y], {
        stroke: '#e5e7eb',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.5,
      })
    );
  }

  lines.forEach((line) => {
    (line as fabric.FabricObject & { isGrid?: boolean }).isGrid = true;
    canvas.add(line);
    canvas.sendObjectToBack(line);
  });
}

export function removeGrid(canvas: fabric.Canvas): void {
  const gridObjects = canvas.getObjects().filter(
    (obj) => (obj as fabric.FabricObject & { isGrid?: boolean }).isGrid
  );
  gridObjects.forEach((obj) => canvas.remove(obj));
}

export function snapToGridValue(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function getObjectName(obj: fabric.FabricObject): string {
  const customName = (obj as fabric.FabricObject & { customName?: string }).customName;
  if (customName) return customName;

  if (obj instanceof fabric.Rect) return 'Rectangle';
  if (obj instanceof fabric.Circle) return 'Ellipse';
  if (obj instanceof fabric.Ellipse) return 'Ellipse';
  if (obj instanceof fabric.Triangle) return 'Triangle';
  if (obj instanceof fabric.Line) return 'Line';
  if (obj instanceof fabric.Polygon) return 'Polygon';
  if (obj instanceof fabric.Polyline) return 'Polyline';
  if (obj instanceof fabric.Path) return 'Path';
  if (obj instanceof fabric.IText || obj instanceof fabric.FabricText) return 'Text';
  if (obj instanceof fabric.FabricImage) return 'Image';
  if (obj instanceof fabric.Group) return 'Group';
  return 'Object';
}

export function generateId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createArrowHead(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string
): fabric.Polygon {
  const headlen = 15;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  const points = [
    { x: toX, y: toY },
    {
      x: toX - headlen * Math.cos(angle - Math.PI / 6),
      y: toY - headlen * Math.sin(angle - Math.PI / 6),
    },
    {
      x: toX - headlen * Math.cos(angle + Math.PI / 6),
      y: toY - headlen * Math.sin(angle + Math.PI / 6),
    },
  ];

  return new fabric.Polygon(points, {
    fill: color,
    stroke: color,
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });
}

export function createStarPoints(
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerRadius;
    let y = cy + Math.sin(rot) * outerRadius;
    points.push({ x, y });
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    points.push({ x, y });
    rot += step;
  }

  return points;
}

export function createPolygonPoints(
  cx: number,
  cy: number,
  sides: number,
  radius: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const angle = (2 * Math.PI) / sides;

  for (let i = 0; i < sides; i++) {
    points.push({
      x: cx + radius * Math.cos(i * angle - Math.PI / 2),
      y: cy + radius * Math.sin(i * angle - Math.PI / 2),
    });
  }

  return points;
}

export function alignObjects(
  canvas: fabric.Canvas,
  alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
): void {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length < 2) return;

  const bounds = activeObjects.map((obj) => {
    const bound = obj.getBoundingRect();
    return bound;
  });

  switch (alignment) {
    case 'left': {
      const minLeft = Math.min(...bounds.map((b) => b.left));
      activeObjects.forEach((obj, i) => {
        obj.set('left', (obj.left ?? 0) + (minLeft - bounds[i].left));
      });
      break;
    }
    case 'center-h': {
      const centers = bounds.map((b) => b.left + b.width / 2);
      const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
      activeObjects.forEach((obj, i) => {
        obj.set('left', (obj.left ?? 0) + (avgCenter - centers[i]));
      });
      break;
    }
    case 'right': {
      const maxRight = Math.max(...bounds.map((b) => b.left + b.width));
      activeObjects.forEach((obj, i) => {
        obj.set('left', (obj.left ?? 0) + (maxRight - (bounds[i].left + bounds[i].width)));
      });
      break;
    }
    case 'top': {
      const minTop = Math.min(...bounds.map((b) => b.top));
      activeObjects.forEach((obj, i) => {
        obj.set('top', (obj.top ?? 0) + (minTop - bounds[i].top));
      });
      break;
    }
    case 'center-v': {
      const centers = bounds.map((b) => b.top + b.height / 2);
      const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
      activeObjects.forEach((obj, i) => {
        obj.set('top', (obj.top ?? 0) + (avgCenter - centers[i]));
      });
      break;
    }
    case 'bottom': {
      const maxBottom = Math.max(...bounds.map((b) => b.top + b.height));
      activeObjects.forEach((obj, i) => {
        obj.set('top', (obj.top ?? 0) + (maxBottom - (bounds[i].top + bounds[i].height)));
      });
      break;
    }
  }

  canvas.requestRenderAll();
}

export function distributeObjects(
  canvas: fabric.Canvas,
  direction: 'horizontal' | 'vertical'
): void {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length < 3) return;

  const bounds = activeObjects.map((obj) => ({
    obj,
    bound: obj.getBoundingRect(),
  }));

  if (direction === 'horizontal') {
    bounds.sort((a, b) => a.bound.left - b.bound.left);
    const totalWidth = bounds.reduce((sum, b) => sum + b.bound.width, 0);
    const totalSpace =
      bounds[bounds.length - 1].bound.left +
      bounds[bounds.length - 1].bound.width -
      bounds[0].bound.left;
    const gap = (totalSpace - totalWidth) / (bounds.length - 1);

    let currentLeft = bounds[0].bound.left;
    bounds.forEach((item) => {
      item.obj.set(
        'left',
        (item.obj.left ?? 0) + (currentLeft - item.bound.left)
      );
      currentLeft += item.bound.width + gap;
    });
  } else {
    bounds.sort((a, b) => a.bound.top - b.bound.top);
    const totalHeight = bounds.reduce((sum, b) => sum + b.bound.height, 0);
    const totalSpace =
      bounds[bounds.length - 1].bound.top +
      bounds[bounds.length - 1].bound.height -
      bounds[0].bound.top;
    const gap = (totalSpace - totalHeight) / (bounds.length - 1);

    let currentTop = bounds[0].bound.top;
    bounds.forEach((item) => {
      item.obj.set(
        'top',
        (item.obj.top ?? 0) + (currentTop - item.bound.top)
      );
      currentTop += item.bound.height + gap;
    });
  }

  canvas.requestRenderAll();
}
