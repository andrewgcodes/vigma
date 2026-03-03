import {
  Canvas,
  Rect,
  Circle,
  Triangle,
  Line,
  Polygon,
  Textbox,
  PencilBrush,
  FabricImage,
  Ellipse,
  FabricObject,
} from 'fabric';

let objectCounter = 0;

function nextId(prefix: string): string {
  objectCounter++;
  return `${prefix}-${objectCounter}`;
}

export function createRectangle(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): Rect {
  const rect = new Rect({
    left,
    top,
    width: 150,
    height: 100,
    fill,
    stroke,
    strokeWidth,
    rx: 0,
    ry: 0,
  });
  (rect as FabricObject & { customId?: string; customName?: string }).customId = nextId('rect');
  (rect as FabricObject & { customName?: string }).customName = `Rectangle ${objectCounter}`;
  return rect;
}

export function createCircle(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): Circle {
  const circle = new Circle({
    left,
    top,
    radius: 60,
    fill,
    stroke,
    strokeWidth,
  });
  (circle as FabricObject & { customId?: string; customName?: string }).customId = nextId('circle');
  (circle as FabricObject & { customName?: string }).customName = `Circle ${objectCounter}`;
  return circle;
}

export function createEllipse(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): Ellipse {
  const ellipse = new Ellipse({
    left,
    top,
    rx: 80,
    ry: 50,
    fill,
    stroke,
    strokeWidth,
  });
  (ellipse as FabricObject & { customId?: string; customName?: string }).customId = nextId('ellipse');
  (ellipse as FabricObject & { customName?: string }).customName = `Ellipse ${objectCounter}`;
  return ellipse;
}

export function createTriangle(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): Triangle {
  const triangle = new Triangle({
    left,
    top,
    width: 120,
    height: 100,
    fill,
    stroke,
    strokeWidth,
  });
  (triangle as FabricObject & { customId?: string; customName?: string }).customId = nextId('tri');
  (triangle as FabricObject & { customName?: string }).customName = `Triangle ${objectCounter}`;
  return triangle;
}

export function createLine(
  points: [number, number, number, number],
  stroke: string,
  strokeWidth: number
): Line {
  const line = new Line(points, {
    stroke: stroke || '#ffffff',
    strokeWidth: strokeWidth || 2,
  });
  (line as FabricObject & { customId?: string; customName?: string }).customId = nextId('line');
  (line as FabricObject & { customName?: string }).customName = `Line ${objectCounter}`;
  return line;
}

export function createArrow(
  points: [number, number, number, number],
  stroke: string,
  strokeWidth: number
): Line {
  const line = new Line(points, {
    stroke: stroke || '#ffffff',
    strokeWidth: strokeWidth || 2,
  });
  (line as FabricObject & { customId?: string; customName?: string }).customId = nextId('arrow');
  (line as FabricObject & { customName?: string }).customName = `Arrow ${objectCounter}`;
  return line;
}

export function createStar(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): Polygon {
  const numPoints = 5;
  const outerRadius = 60;
  const innerRadius = 30;
  const points = [];

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  const star = new Polygon(points, {
    left,
    top,
    fill,
    stroke,
    strokeWidth,
  });
  (star as FabricObject & { customId?: string; customName?: string }).customId = nextId('star');
  (star as FabricObject & { customName?: string }).customName = `Star ${objectCounter}`;
  return star;
}

export function createPolygon(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
  sides: number = 6
): Polygon {
  const radius = 60;
  const points = [];

  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  const polygon = new Polygon(points, {
    left,
    top,
    fill,
    stroke,
    strokeWidth,
  });
  (polygon as FabricObject & { customId?: string; customName?: string }).customId = nextId('poly');
  (polygon as FabricObject & { customName?: string }).customName = `Polygon ${objectCounter}`;
  return polygon;
}

export function createTextbox(
  left: number,
  top: number,
  fill: string
): Textbox {
  const textbox = new Textbox('Type here...', {
    left,
    top,
    width: 200,
    fontSize: 24,
    fill,
    fontFamily: 'Arial',
    editable: true,
  });
  (textbox as FabricObject & { customId?: string; customName?: string }).customId = nextId('text');
  (textbox as FabricObject & { customName?: string }).customName = `Text ${objectCounter}`;
  return textbox;
}

export function setupDrawingBrush(canvas: Canvas, color: string, width: number): void {
  canvas.freeDrawingBrush = new PencilBrush(canvas);
  canvas.freeDrawingBrush.color = color;
  canvas.freeDrawingBrush.width = width;
}

export async function addImageToCanvas(
  canvas: Canvas,
  file: File
): Promise<void> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const imgEl = document.createElement('img');
      imgEl.onload = () => {
        const fabricImg = new FabricImage(imgEl, {
          left: 100,
          top: 100,
        });

        const maxDim = 400;
        const scale = Math.min(maxDim / imgEl.width, maxDim / imgEl.height, 1);
        fabricImg.scaleX = scale;
        fabricImg.scaleY = scale;

        (fabricImg as FabricObject & { customId?: string; customName?: string }).customId = nextId('img');
        (fabricImg as FabricObject & { customName?: string }).customName = `Image ${objectCounter}`;

        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();
        resolve();
      };
      imgEl.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function exportToPNG(canvas: Canvas): void {
  const dataURL = canvas.toDataURL({
    format: 'png',
    multiplier: 2,
  });
  downloadFile(dataURL, 'vigma-design.png');
}

export function exportToSVG(canvas: Canvas): void {
  const svg = canvas.toSVG();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, 'vigma-design.svg');
  URL.revokeObjectURL(url);
}

export function exportToJSON(canvas: Canvas): void {
  const json = JSON.stringify(canvas.toObject(['customId', 'customName']), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, 'vigma-design.json');
  URL.revokeObjectURL(url);
}

export function importFromJSON(canvas: Canvas, jsonString: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const json = JSON.parse(jsonString);
      canvas.loadFromJSON(json).then(() => {
        canvas.renderAll();
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getObjectName(obj: FabricObject): string {
  const customObj = obj as FabricObject & { customName?: string };
  if (customObj.customName) return customObj.customName;
  const type = obj.type || 'object';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getObjectId(obj: FabricObject): string {
  const customObj = obj as FabricObject & { customId?: string };
  if (!customObj.customId) {
    customObj.customId = `obj-${Math.random().toString(36).substr(2, 9)}`;
  }
  return customObj.customId;
}
