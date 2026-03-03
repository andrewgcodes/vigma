import * as fabric from 'fabric';

export function createGrid(canvas: fabric.Canvas, gridSize: number, zoom: number): fabric.Group {
  const width = canvas.width! / zoom;
  const height = canvas.height! / zoom;
  const lines: fabric.FabricObject[] = [];
  
  for (let i = -width; i < width * 2; i += gridSize) {
    lines.push(new fabric.Line([i, -height, i, height * 2], {
      stroke: '#e0e0e0',
      strokeWidth: 0.5 / zoom,
      selectable: false,
      evented: false,
    }));
  }
  
  for (let i = -height; i < height * 2; i += gridSize) {
    lines.push(new fabric.Line([-width, i, width * 2, i], {
      stroke: '#e0e0e0',
      strokeWidth: 0.5 / zoom,
      selectable: false,
      evented: false,
    }));
  }
  
  const group = new fabric.Group(lines, {
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  
  return group;
}

export function snapToGridValue(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function generateId(): string {
  return `obj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createRectangle(options: {
  left: number;
  top: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rx?: number;
  ry?: number;
  opacity?: number;
}): fabric.Rect {
  const rect = new fabric.Rect({
    ...options,
    rx: options.rx || 0,
    ry: options.ry || 0,
    opacity: options.opacity ?? 1,
  });
  (rect as any).customId = generateId();
  (rect as any).customName = 'Rectangle';
  return rect;
}

export function createEllipse(options: {
  left: number;
  top: number;
  rx: number;
  ry: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
}): fabric.Ellipse {
  const ellipse = new fabric.Ellipse({
    ...options,
    opacity: options.opacity ?? 1,
  });
  (ellipse as any).customId = generateId();
  (ellipse as any).customName = 'Ellipse';
  return ellipse;
}

export function createLine(options: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}): fabric.Line {
  const line = new fabric.Line([options.x1, options.y1, options.x2, options.y2], {
    stroke: options.stroke,
    strokeWidth: options.strokeWidth,
  });
  (line as any).customId = generateId();
  (line as any).customName = 'Line';
  return line;
}

export function createArrow(options: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}): fabric.Group {
  const dx = options.x2 - options.x1;
  const dy = options.y2 - options.y1;
  const angle = Math.atan2(dy, dx);
  const headLen = 15;

  const line = new fabric.Line([options.x1, options.y1, options.x2, options.y2], {
    stroke: options.stroke,
    strokeWidth: options.strokeWidth,
  });

  const head = new fabric.Polygon([
    { x: 0, y: 0 },
    { x: -headLen, y: headLen / 2 },
    { x: -headLen, y: -headLen / 2 },
  ], {
    left: options.x2,
    top: options.y2,
    fill: options.stroke,
    angle: (angle * 180) / Math.PI,
    originX: 'center',
    originY: 'center',
  });

  const group = new fabric.Group([line, head]);
  (group as any).customId = generateId();
  (group as any).customName = 'Arrow';
  return group;
}

export function createTriangle(options: {
  left: number;
  top: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}): fabric.Triangle {
  const triangle = new fabric.Triangle(options);
  (triangle as any).customId = generateId();
  (triangle as any).customName = 'Triangle';
  return triangle;
}

export function createStar(options: {
  left: number;
  top: number;
  outerRadius: number;
  innerRadius: number;
  points: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}): fabric.Polygon {
  const { left, top, outerRadius, innerRadius, points, fill, stroke, strokeWidth } = options;
  const starPoints: { x: number; y: number }[] = [];
  
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    starPoints.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  
  const star = new fabric.Polygon(starPoints, {
    left,
    top,
    fill,
    stroke,
    strokeWidth,
  });
  (star as any).customId = generateId();
  (star as any).customName = 'Star';
  return star;
}

export function createPolygonShape(options: {
  left: number;
  top: number;
  radius: number;
  sides: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}): fabric.Polygon {
  const { left, top, radius, sides, fill, stroke, strokeWidth } = options;
  const points: { x: number; y: number }[] = [];
  
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  
  const polygon = new fabric.Polygon(points, {
    left,
    top,
    fill,
    stroke,
    strokeWidth,
  });
  (polygon as any).customId = generateId();
  (polygon as any).customName = `Polygon (${sides})`;
  return polygon;
}

export function createTextObject(options: {
  left: number;
  top: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  textAlign?: string;
}): fabric.IText {
  const textObj = new fabric.IText(options.text, {
    left: options.left,
    top: options.top,
    fontSize: options.fontSize,
    fontFamily: options.fontFamily,
    fontWeight: options.fontWeight as any,
    fill: options.fill,
    textAlign: (options.textAlign || 'left') as 'left' | 'center' | 'right' | 'justify',
    editable: true,
  });
  (textObj as any).customId = generateId();
  (textObj as any).customName = 'Text';
  return textObj;
}

export function createFrame(options: {
  left: number;
  top: number;
  width: number;
  height: number;
  name?: string;
}): fabric.Rect {
  const frame = new fabric.Rect({
    left: options.left,
    top: options.top,
    width: options.width,
    height: options.height,
    fill: '#ffffff',
    stroke: '#cccccc',
    strokeWidth: 1,
    rx: 0,
    ry: 0,
  });
  (frame as any).customId = generateId();
  (frame as any).customName = options.name || 'Frame';
  (frame as any).isFrame = true;
  return frame;
}

export function applyGradient(
  obj: fabric.FabricObject,
  type: 'linear' | 'radial',
  colorStops: { offset: number; color: string }[],
  angle: number = 0
): void {
  if (type === 'linear') {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    obj.set('fill', new fabric.Gradient({
      type: 'linear',
      coords: {
        x1: 0.5 - cos / 2,
        y1: 0.5 - sin / 2,
        x2: 0.5 + cos / 2,
        y2: 0.5 + sin / 2,
      },
      colorStops: colorStops.map((s) => ({
        offset: s.offset,
        color: s.color,
      })),
      gradientUnits: 'percentage',
    }));
  } else {
    obj.set('fill', new fabric.Gradient({
      type: 'radial',
      coords: {
        x1: 0.5,
        y1: 0.5,
        x2: 0.5,
        y2: 0.5,
        r1: 0,
        r2: 0.5,
      },
      colorStops: colorStops.map((s) => ({
        offset: s.offset,
        color: s.color,
      })),
      gradientUnits: 'percentage',
    }));
  }
}

export function getObjectBounds(obj: fabric.FabricObject): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const br = obj.getBoundingRect();
  return {
    left: br.left,
    top: br.top,
    width: br.width,
    height: br.height,
  };
}

export function alignObjects(
  objects: fabric.FabricObject[],
  alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
): void {
  if (objects.length < 2) return;
  
  const bounds = objects.map((o) => getObjectBounds(o));
  
  switch (alignment) {
    case 'left': {
      const minLeft = Math.min(...bounds.map((b) => b.left));
      objects.forEach((o, i) => {
        o.set('left', (o.left || 0) + (minLeft - bounds[i].left));
      });
      break;
    }
    case 'center-h': {
      const centers = bounds.map((b) => b.left + b.width / 2);
      const avg = centers.reduce((a, b) => a + b, 0) / centers.length;
      objects.forEach((o, i) => {
        o.set('left', (o.left || 0) + (avg - centers[i]));
      });
      break;
    }
    case 'right': {
      const maxRight = Math.max(...bounds.map((b) => b.left + b.width));
      objects.forEach((o, i) => {
        o.set('left', (o.left || 0) + (maxRight - bounds[i].left - bounds[i].width));
      });
      break;
    }
    case 'top': {
      const minTop = Math.min(...bounds.map((b) => b.top));
      objects.forEach((o, i) => {
        o.set('top', (o.top || 0) + (minTop - bounds[i].top));
      });
      break;
    }
    case 'center-v': {
      const centers = bounds.map((b) => b.top + b.height / 2);
      const avg = centers.reduce((a, b) => a + b, 0) / centers.length;
      objects.forEach((o, i) => {
        o.set('top', (o.top || 0) + (avg - centers[i]));
      });
      break;
    }
    case 'bottom': {
      const maxBottom = Math.max(...bounds.map((b) => b.top + b.height));
      objects.forEach((o, i) => {
        o.set('top', (o.top || 0) + (maxBottom - bounds[i].top - bounds[i].height));
      });
      break;
    }
  }
}

export function distributeObjects(
  objects: fabric.FabricObject[],
  direction: 'horizontal' | 'vertical'
): void {
  if (objects.length < 3) return;
  
  const bounds = objects.map((o, i) => ({ ...getObjectBounds(o), index: i }));
  
  if (direction === 'horizontal') {
    bounds.sort((a, b) => a.left - b.left);
    const totalWidth = bounds.reduce((sum, b) => sum + b.width, 0);
    const totalSpace = bounds[bounds.length - 1].left + bounds[bounds.length - 1].width - bounds[0].left;
    const gap = (totalSpace - totalWidth) / (bounds.length - 1);
    
    let currentX = bounds[0].left;
    bounds.forEach((b, i) => {
      if (i > 0) {
        const obj = objects[b.index];
        obj.set('left', (obj.left || 0) + (currentX - b.left));
      }
      currentX += b.width + gap;
    });
  } else {
    bounds.sort((a, b) => a.top - b.top);
    const totalHeight = bounds.reduce((sum, b) => sum + b.height, 0);
    const totalSpace = bounds[bounds.length - 1].top + bounds[bounds.length - 1].height - bounds[0].top;
    const gap = (totalSpace - totalHeight) / (bounds.length - 1);
    
    let currentY = bounds[0].top;
    bounds.forEach((b, i) => {
      if (i > 0) {
        const obj = objects[b.index];
        obj.set('top', (obj.top || 0) + (currentY - b.top));
      }
      currentY += b.height + gap;
    });
  }
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function rgbaToHex(rgba: string): { hex: string; alpha: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { hex: '#000000', alpha: 1 };
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  const alpha = match[4] ? parseFloat(match[4]) : 1;
  return { hex: `#${r}${g}${b}`, alpha };
}
