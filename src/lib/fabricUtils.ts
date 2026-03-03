import * as fabric from "fabric";

let objectCounter = 0;

function nextId(): string {
  objectCounter++;
  return `obj_${Date.now()}_${objectCounter}`;
}

function getObjectName(type: string): string {
  objectCounter++;
  const names: Record<string, string> = {
    rect: "Rectangle",
    circle: "Ellipse",
    triangle: "Triangle",
    line: "Line",
    polyline: "Arrow",
    polygon: "Star",
    textbox: "Text",
    path: "Path",
    image: "Image",
    group: "Group",
  };
  return `${names[type] || "Object"} ${objectCounter}`;
}

export function createRectangle(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
  cornerRadius: number
): fabric.Rect {
  const id = nextId();
  const rect = new fabric.Rect({
    left,
    top,
    width: 200,
    height: 150,
    fill,
    stroke: strokeWidth > 0 ? stroke : "transparent",
    strokeWidth,
    rx: cornerRadius,
    ry: cornerRadius,
    strokeUniform: true,
  });
  (rect as fabric.Rect & { id: string; name: string }).id = id;
  (rect as fabric.Rect & { id: string; name: string }).name = getObjectName("rect");
  return rect;
}

export function createEllipse(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): fabric.Ellipse {
  const id = nextId();
  const ellipse = new fabric.Ellipse({
    left,
    top,
    rx: 100,
    ry: 75,
    fill,
    stroke: strokeWidth > 0 ? stroke : "transparent",
    strokeWidth,
    strokeUniform: true,
  });
  (ellipse as fabric.Ellipse & { id: string; name: string }).id = id;
  (ellipse as fabric.Ellipse & { id: string; name: string }).name = getObjectName("circle");
  return ellipse;
}

export function createTriangle(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): fabric.Triangle {
  const id = nextId();
  const triangle = new fabric.Triangle({
    left,
    top,
    width: 180,
    height: 160,
    fill,
    stroke: strokeWidth > 0 ? stroke : "transparent",
    strokeWidth,
    strokeUniform: true,
  });
  (triangle as fabric.Triangle & { id: string; name: string }).id = id;
  (triangle as fabric.Triangle & { id: string; name: string }).name = getObjectName("triangle");
  return triangle;
}

export function createLine(
  left: number,
  top: number,
  stroke: string,
  strokeWidth: number
): fabric.Line {
  const id = nextId();
  const line = new fabric.Line([left, top, left + 200, top], {
    stroke: stroke || "#1d1d1f",
    strokeWidth: strokeWidth || 2,
    strokeUniform: true,
  });
  (line as fabric.Line & { id: string; name: string }).id = id;
  (line as fabric.Line & { id: string; name: string }).name = getObjectName("line");
  return line;
}

export function createArrow(
  left: number,
  top: number,
  stroke: string,
  strokeWidth: number
): fabric.Polyline {
  const id = nextId();
  const headLen = 15;
  const points = [
    { x: left, y: top },
    { x: left + 200, y: top },
  ];
  const endX = left + 200;
  const endY = top;
  const angle = Math.atan2(0, 200);
  const arrowHead = [
    { x: endX - headLen * Math.cos(angle - Math.PI / 6), y: endY - headLen * Math.sin(angle - Math.PI / 6) },
    { x: endX, y: endY },
    { x: endX - headLen * Math.cos(angle + Math.PI / 6), y: endY - headLen * Math.sin(angle + Math.PI / 6) },
  ];

  const allPoints = [...points, ...arrowHead];
  const arrow = new fabric.Polyline(allPoints, {
    stroke: stroke || "#1d1d1f",
    strokeWidth: strokeWidth || 2,
    fill: "transparent",
    strokeUniform: true,
    left,
    top: top - headLen,
  });
  (arrow as fabric.Polyline & { id: string; name: string }).id = id;
  (arrow as fabric.Polyline & { id: string; name: string }).name = getObjectName("polyline");
  return arrow;
}

export function createStar(
  left: number,
  top: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): fabric.Polygon {
  const id = nextId();
  const outerRadius = 80;
  const innerRadius = 40;
  const numPoints = 5;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  const star = new fabric.Polygon(points, {
    left,
    top,
    fill,
    stroke: strokeWidth > 0 ? stroke : "transparent",
    strokeWidth,
    strokeUniform: true,
  });
  (star as fabric.Polygon & { id: string; name: string }).id = id;
  (star as fabric.Polygon & { id: string; name: string }).name = getObjectName("polygon");
  return star;
}

export function createTextbox(
  left: number,
  top: number,
  fill: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: string
): fabric.Textbox {
  const id = nextId();
  const text = new fabric.Textbox("Type here", {
    left,
    top,
    width: 200,
    fill,
    fontFamily,
    fontSize,
    fontWeight,
    editable: true,
    strokeUniform: true,
  });
  (text as fabric.Textbox & { id: string; name: string }).id = id;
  (text as fabric.Textbox & { id: string; name: string }).name = getObjectName("textbox");
  return text;
}

export function addImageToCanvas(
  canvas: fabric.Canvas,
  file: File
): Promise<void> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        const img = new fabric.FabricImage(imgElement, {
          left: 100,
          top: 100,
          strokeUniform: true,
        });
        // Scale to fit within 400px
        const maxDim = 400;
        if (img.width && img.height) {
          const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
          img.scale(scale);
        }
        const id = nextId();
        (img as fabric.FabricImage & { id: string; name: string }).id = id;
        (img as fabric.FabricImage & { id: string; name: string }).name = getObjectName("image");
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        resolve();
      };
      imgElement.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function exportCanvasAsPNG(canvas: fabric.Canvas, fileName = "design.png") {
  const dataURL = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 2,
  });
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function exportCanvasAsSVG(canvas: fabric.Canvas, fileName = "design.svg") {
  const svg = canvas.toSVG();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCanvasAsJSON(canvas: fabric.Canvas, fileName = "design.json") {
  const json = JSON.stringify(canvas.toJSON(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadCanvasFromJSON(canvas: fabric.Canvas, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        canvas.loadFromJSON(json).then(() => {
          canvas.renderAll();
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
