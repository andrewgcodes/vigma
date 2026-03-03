import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';

export class CanvasEngine {
  canvas: fabric.Canvas | null = null;
  private gridGroup: fabric.Group | null = null;
  private isPanning = false;
  private lastPanPoint: { x: number; y: number } | null = null;
  private clipboard: fabric.FabricObject[] = [];
  private onSelectionChange?: (ids: string[]) => void;
  private onObjectsChange?: () => void;
  private onZoomChange?: (zoom: number) => void;
  private onCursorMove?: (x: number, y: number) => void;
  private historyPaused = false;
  private onHistoryPush?: (json: string) => void;
  private _restoring: Promise<void> | null = null;

  // Drag-to-create state
  private drawingShape: fabric.FabricObject | null = null;
  private drawOrigin: { x: number; y: number } | null = null;
  private drawingTool: string | null = null;
  private drawShapeOptions: Record<string, unknown> = {};

  // Snap to grid
  private snapEnabled = false;
  private snapGridSize = 20;

  // Context menu
  private onContextMenu?: (x: number, y: number, hasTarget: boolean) => void;

  init(
    canvasElement: HTMLCanvasElement,
    options: {
      onSelectionChange?: (ids: string[]) => void;
      onObjectsChange?: () => void;
      onZoomChange?: (zoom: number) => void;
      onHistoryPush?: (json: string) => void;
      onCursorMove?: (x: number, y: number) => void;
      onContextMenu?: (x: number, y: number, hasTarget: boolean) => void;
    }
  ) {
    this.canvas = new fabric.Canvas(canvasElement, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f8f9fa',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      controlsAboveOverlay: true,
    });

    this.onSelectionChange = options.onSelectionChange;
    this.onObjectsChange = options.onObjectsChange;
    this.onZoomChange = options.onZoomChange;
    this.onHistoryPush = options.onHistoryPush;
    this.onCursorMove = options.onCursorMove;
    this.onContextMenu = options.onContextMenu;

    this.setupEventListeners();
    this.saveHistory();

    return this.canvas;
  }

  private setupEventListeners() {
    if (!this.canvas) return;

    this.canvas.on('selection:created', (e) => {
      const ids = e.selected?.map((o) => (o as fabric.FabricObject & { id?: string }).id || '').filter(Boolean) || [];
      this.onSelectionChange?.(ids);
    });

    this.canvas.on('selection:updated', (e) => {
      const ids = e.selected?.map((o) => (o as fabric.FabricObject & { id?: string }).id || '').filter(Boolean) || [];
      this.onSelectionChange?.(ids);
    });

    this.canvas.on('selection:cleared', () => {
      this.onSelectionChange?.([]);
    });

    this.canvas.on('object:modified', () => {
      this.saveHistory();
      this.onObjectsChange?.();
    });

    this.canvas.on('object:added', () => {
      if (!this.historyPaused) {
        this.saveHistory();
      }
      this.onObjectsChange?.();
    });

    this.canvas.on('object:removed', () => {
      this.saveHistory();
      this.onObjectsChange?.();
    });

    // Mouse wheel zoom
    this.canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = this.canvas!.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.max(0.1, Math.min(10, zoom));

      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      this.canvas!.zoomToPoint(point, zoom);
      this.onZoomChange?.(zoom);

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Track cursor position
    this.canvas.on('mouse:move', (opt) => {
      const pointer = this.canvas!.getScenePoint(opt.e);
      this.onCursorMove?.(Math.round(pointer.x), Math.round(pointer.y));
    });

    // Right-click context menu
    this.canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        const hasTarget = !!opt.target;
        if (opt.target) {
          this.canvas!.setActiveObject(opt.target);
          this.canvas!.requestRenderAll();
        }
        this.onContextMenu?.(e.clientX, e.clientY, hasTarget);
      }
    });
  }

  enablePanning() {
    if (!this.canvas) return;

    this.canvas.on('mouse:down', this.handlePanStart);
    this.canvas.on('mouse:move', this.handlePanMove);
    this.canvas.on('mouse:up', this.handlePanEnd);
  }

  disablePanning() {
    if (!this.canvas) return;

    this.canvas.off('mouse:down', this.handlePanStart);
    this.canvas.off('mouse:move', this.handlePanMove);
    this.canvas.off('mouse:up', this.handlePanEnd);
    this.isPanning = false;
  }

  private handlePanStart = (opt: fabric.TEvent<fabric.TPointerEvent>) => {
    const e = opt.e as MouseEvent;
    if (e.button === 1 || opt.e.type === 'touchstart') {
      this.isPanning = true;
      this.lastPanPoint = { x: e.clientX, y: e.clientY };
      this.canvas!.selection = false;
    }
  };

  private handlePanMove = (opt: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.isPanning || !this.lastPanPoint) return;
    const e = opt.e as MouseEvent;

    const vpt = this.canvas!.viewportTransform!;
    vpt[4] += e.clientX - this.lastPanPoint.x;
    vpt[5] += e.clientY - this.lastPanPoint.y;

    this.canvas!.requestRenderAll();
    this.lastPanPoint = { x: e.clientX, y: e.clientY };
  };

  private handlePanEnd = () => {
    this.isPanning = false;
    this.lastPanPoint = null;
    this.canvas!.selection = true;
    this.canvas!.setViewportTransform(this.canvas!.viewportTransform!);
  };

  enableHandTool() {
    if (!this.canvas) return;
    this.canvas.defaultCursor = 'grab';
    this.canvas.selection = false;
    this.canvas.forEachObject((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });

    this.canvas.on('mouse:down', this.handleHandDown);
    this.canvas.on('mouse:move', this.handleHandMove);
    this.canvas.on('mouse:up', this.handleHandUp);
  }

  disableHandTool() {
    if (!this.canvas) return;
    this.canvas.defaultCursor = 'default';
    this.canvas.selection = true;
    this.canvas.forEachObject((obj) => {
      if ((obj as fabric.FabricObject & { customType?: string }).customType !== 'grid') {
        const isLocked = obj.lockMovementX;
        obj.selectable = !isLocked;
        obj.evented = !isLocked;
      }
    });

    this.canvas.off('mouse:down', this.handleHandDown);
    this.canvas.off('mouse:move', this.handleHandMove);
    this.canvas.off('mouse:up', this.handleHandUp);
  }

  private handleHandDown = (opt: fabric.TEvent<fabric.TPointerEvent>) => {
    const e = opt.e as MouseEvent;
    this.isPanning = true;
    this.lastPanPoint = { x: e.clientX, y: e.clientY };
    if (this.canvas) this.canvas.defaultCursor = 'grabbing';
  };

  private handleHandMove = (opt: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.isPanning || !this.lastPanPoint || !this.canvas) return;
    const e = opt.e as MouseEvent;

    const vpt = this.canvas.viewportTransform!;
    vpt[4] += e.clientX - this.lastPanPoint.x;
    vpt[5] += e.clientY - this.lastPanPoint.y;

    this.canvas.requestRenderAll();
    this.lastPanPoint = { x: e.clientX, y: e.clientY };
  };

  private handleHandUp = () => {
    this.isPanning = false;
    this.lastPanPoint = null;
    if (this.canvas) this.canvas.defaultCursor = 'grab';
    this.canvas?.setViewportTransform(this.canvas.viewportTransform!);
  };

  // Drawing tools
  enableDrawing(options: { color: string; width: number }) {
    if (!this.canvas) return;
    this.canvas.isDrawingMode = true;
    const brush = new fabric.PencilBrush(this.canvas);
    brush.color = options.color;
    brush.width = options.width;
    this.canvas.freeDrawingBrush = brush;
  }

  disableDrawing() {
    if (!this.canvas) return;
    this.canvas.isDrawingMode = false;
  }

  // Snap to grid helpers
  setSnapEnabled(enabled: boolean) {
    this.snapEnabled = enabled;
  }

  setSnapGridSize(size: number) {
    this.snapGridSize = size;
  }

  private snapValue(val: number): number {
    if (!this.snapEnabled) return val;
    return Math.round(val / this.snapGridSize) * this.snapGridSize;
  }

  // Drag-to-create: start drawing a shape
  startDragCreate(tool: string, e: MouseEvent, shapeOptions: Record<string, unknown>) {
    if (!this.canvas) return;
    const pointer = this.canvas.getScenePoint(e);
    const x = this.snapValue(pointer.x);
    const y = this.snapValue(pointer.y);
    this.drawOrigin = { x, y };
    this.drawingTool = tool;
    this.drawShapeOptions = shapeOptions;

    this.historyPaused = true;

    switch (tool) {
      case 'rectangle': {
        const rect = new fabric.Rect({
          left: x, top: y, width: 1, height: 1,
          fill: shapeOptions.fill as string,
          stroke: shapeOptions.stroke as string,
          strokeWidth: shapeOptions.strokeWidth as number,
          opacity: shapeOptions.opacity as number,
          rx: (shapeOptions.rx as number) || 0,
          ry: (shapeOptions.ry as number) || 0,
        });
        this.setObjectId(rect);
        this.canvas.add(rect);
        this.drawingShape = rect;
        break;
      }
      case 'ellipse': {
        const ellipse = new fabric.Ellipse({
          left: x, top: y, rx: 0.5, ry: 0.5,
          fill: shapeOptions.fill as string,
          stroke: shapeOptions.stroke as string,
          strokeWidth: shapeOptions.strokeWidth as number,
          opacity: shapeOptions.opacity as number,
        });
        this.setObjectId(ellipse);
        this.canvas.add(ellipse);
        this.drawingShape = ellipse;
        break;
      }
      case 'triangle': {
        const tri = new fabric.Triangle({
          left: x, top: y, width: 1, height: 1,
          fill: shapeOptions.fill as string,
          stroke: shapeOptions.stroke as string,
          strokeWidth: shapeOptions.strokeWidth as number,
          opacity: shapeOptions.opacity as number,
        });
        this.setObjectId(tri);
        this.canvas.add(tri);
        this.drawingShape = tri;
        break;
      }
      case 'line': {
        const line = new fabric.Line([x, y, x, y], {
          stroke: (shapeOptions.stroke as string) || '#000000',
          strokeWidth: (shapeOptions.strokeWidth as number) || 2,
          opacity: shapeOptions.opacity as number,
        });
        this.setObjectId(line);
        this.canvas.add(line);
        this.drawingShape = line;
        break;
      }
      case 'frame': {
        const frame = new fabric.Rect({
          left: x, top: y, width: 1, height: 1,
          fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1,
          rx: 0, ry: 0,
        });
        const labelObj = frame as fabric.FabricObject & { customName?: string; customType?: string };
        this.setObjectId(frame);
        labelObj.customName = `Frame ${(this.canvas.getObjects().length || 0) + 1}`;
        labelObj.customType = 'frame';
        this.canvas.add(frame);
        this.drawingShape = frame;
        break;
      }
    }
    this.canvas.requestRenderAll();
  }

  updateDragCreate(e: MouseEvent) {
    if (!this.canvas || !this.drawingShape || !this.drawOrigin) return;
    const pointer = this.canvas.getScenePoint(e);
    const px = this.snapValue(pointer.x);
    const py = this.snapValue(pointer.y);
    const ox = this.drawOrigin.x;
    const oy = this.drawOrigin.y;

    const left = Math.min(ox, px);
    const top = Math.min(oy, py);
    const w = Math.abs(px - ox);
    const h = Math.abs(py - oy);

    if (this.drawingTool === 'line') {
      (this.drawingShape as fabric.Line).set({ x1: ox, y1: oy, x2: px, y2: py });
    } else if (this.drawingTool === 'ellipse') {
      (this.drawingShape as fabric.Ellipse).set({ left, top, rx: w / 2, ry: h / 2 });
    } else {
      this.drawingShape.set({ left, top, width: Math.max(w, 1), height: Math.max(h, 1) });
    }
    this.drawingShape.setCoords();
    this.canvas.requestRenderAll();
  }

  finishDragCreate(): fabric.FabricObject | null {
    if (!this.canvas || !this.drawingShape) {
      this.historyPaused = false;
      return null;
    }
    const shape = this.drawingShape;
    // If shape is too small (just a click), give it default dimensions
    const w = shape.width || 0;
    const h = shape.height || 0;
    if (this.drawingTool !== 'line' && w < 5 && h < 5) {
      // Treat as a click — set reasonable defaults
      if (this.drawingTool === 'ellipse') {
        (shape as fabric.Ellipse).set({ rx: 60, ry: 40 });
      } else if (this.drawingTool === 'frame') {
        shape.set({ width: 375, height: 667 });
      } else {
        shape.set({ width: 150, height: 100 });
      }
      shape.setCoords();
    }

    this.canvas.setActiveObject(shape);
    this.canvas.requestRenderAll();

    this.drawingShape = null;
    this.drawOrigin = null;
    this.drawingTool = null;
    this.drawShapeOptions = {};
    this.historyPaused = false;
    this.saveHistory();
    this.onObjectsChange?.();
    return shape;
  }

  cancelDragCreate() {
    if (this.drawingShape && this.canvas) {
      this.canvas.remove(this.drawingShape);
    }
    this.drawingShape = null;
    this.drawOrigin = null;
    this.drawingTool = null;
    this.drawShapeOptions = {};
    this.historyPaused = false;
  }

  isDragCreating(): boolean {
    return this.drawingShape !== null;
  }

  // Shape creation (click-to-place fallback)
  addRectangle(options: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    rx?: number;
    ry?: number;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const rect = new fabric.Rect({
      left: center.x - 75,
      top: center.y - 50,
      width: 150,
      height: 100,
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      rx: options.rx || 0,
      ry: options.ry || 0,
    });
    this.setObjectId(rect);
    this.canvas.add(rect);
    this.canvas.setActiveObject(rect);
    this.canvas.requestRenderAll();
    return rect;
  }

  addEllipse(options: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const ellipse = new fabric.Ellipse({
      left: center.x - 60,
      top: center.y - 40,
      rx: 60,
      ry: 40,
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    this.setObjectId(ellipse);
    this.canvas.add(ellipse);
    this.canvas.setActiveObject(ellipse);
    this.canvas.requestRenderAll();
    return ellipse;
  }

  addTriangle(options: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const triangle = new fabric.Triangle({
      left: center.x - 50,
      top: center.y - 43,
      width: 100,
      height: 86,
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    this.setObjectId(triangle);
    this.canvas.add(triangle);
    this.canvas.setActiveObject(triangle);
    this.canvas.requestRenderAll();
    return triangle;
  }

  addLine(options: {
    stroke: string;
    strokeWidth: number;
    opacity: number;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const line = new fabric.Line(
      [center.x - 75, center.y, center.x + 75, center.y],
      {
        stroke: options.stroke || '#000000',
        strokeWidth: options.strokeWidth || 2,
        opacity: options.opacity,
      }
    );
    this.setObjectId(line);
    this.canvas.add(line);
    this.canvas.setActiveObject(line);
    this.canvas.requestRenderAll();
    return line;
  }

  addPolygon(options: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    sides?: number;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const sides = options.sides || 6;
    const radius = 50;
    const points: fabric.XY[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }

    const polygon = new fabric.Polygon(points, {
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    this.setObjectId(polygon);
    this.canvas.add(polygon);
    this.canvas.setActiveObject(polygon);
    this.canvas.requestRenderAll();
    return polygon;
  }

  addStar(options: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    points?: number;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const numPoints = options.points || 5;
    const outerRadius = 50;
    const innerRadius = 25;
    const starPoints: fabric.XY[] = [];

    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      starPoints.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }

    const star = new fabric.Polygon(starPoints, {
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    this.setObjectId(star);
    this.canvas.add(star);
    this.canvas.setActiveObject(star);
    this.canvas.requestRenderAll();
    return star;
  }

  addText(options: {
    fill: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: string;
    opacity: number;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const text = new fabric.IText('Type here', {
      left: center.x - 50,
      top: center.y - 15,
      fill: options.fill,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      fontWeight: options.fontWeight as string,
      fontStyle: options.fontStyle as '' | 'normal' | 'italic' | 'oblique',
      textAlign: options.textAlign as 'left' | 'center' | 'right' | 'justify',
      opacity: options.opacity,
      editable: true,
    });
    this.setObjectId(text);
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    text.enterEditing();
    this.canvas.requestRenderAll();
    return text;
  }

  addFrame(options: {
    width?: number;
    height?: number;
    name?: string;
  }) {
    if (!this.canvas) return;
    const center = this.getCanvasCenter();
    const w = options.width || 375;
    const h = options.height || 667;

    const frame = new fabric.Rect({
      left: center.x - w / 2,
      top: center.y - h / 2,
      width: w,
      height: h,
      fill: '#ffffff',
      stroke: '#e5e7eb',
      strokeWidth: 1,
      rx: 0,
      ry: 0,
    });

    const labelObj = frame as fabric.FabricObject & { id?: string; customName?: string; customType?: string };
    this.setObjectId(frame);
    labelObj.customName = options.name || `Frame ${this.canvas.getObjects().length + 1}`;
    labelObj.customType = 'frame';

    this.canvas.add(frame);
    this.canvas.setActiveObject(frame);
    this.canvas.requestRenderAll();
    return frame;
  }

  async addImage(url: string) {
    if (!this.canvas) return;
    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const center = this.getCanvasCenter();

      // Scale down large images
      const maxSize = 400;
      const scale = Math.min(
        maxSize / (img.width || maxSize),
        maxSize / (img.height || maxSize),
        1
      );
      img.scale(scale);

      img.set({
        left: center.x - ((img.width || 0) * scale) / 2,
        top: center.y - ((img.height || 0) * scale) / 2,
      });

      this.setObjectId(img);
      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.requestRenderAll();
      return img;
    } catch (err) {
      console.error('Failed to load image:', err);
    }
  }

  // Nudge selected objects
  nudgeSelected(dx: number, dy: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((obj) => {
      obj.set({
        left: this.snapValue((obj.left || 0) + dx),
        top: this.snapValue((obj.top || 0) + dy),
      });
      obj.setCoords();
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  // Rename object
  renameObject(id: string, name: string) {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (obj) {
      (obj as fabric.FabricObject & { customName?: string }).customName = name;
      this.onObjectsChange?.();
    }
  }

  // Move layer order
  moveLayerTo(id: string, targetIndex: number) {
    if (!this.canvas) return;
    const objects = this.canvas.getObjects();
    const obj = objects.find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (!obj) return;

    // Calculate actual canvas index (layers panel shows reversed, skip grid objects)
    const nonGridObjects = objects.filter(
      (o) => (o as fabric.FabricObject & { customType?: string }).customType !== 'grid'
    );
    const reversedIndex = nonGridObjects.length - 1 - targetIndex;
    const gridCount = objects.length - nonGridObjects.length;
    const canvasIndex = Math.max(gridCount, Math.min(objects.length - 1, reversedIndex + gridCount));

    // Remove and re-insert at target position
    this.canvas.remove(obj);
    const allObjs = this.canvas.getObjects();
    const insertAt = Math.min(canvasIndex, allObjs.length);
    this.canvas.insertAt(insertAt, obj);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.onObjectsChange?.();
  }

  // Object manipulation
  deleteSelected() {
    if (!this.canvas) return;
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    activeObjects.forEach((obj) => {
      this.canvas!.remove(obj);
    });
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  duplicateSelected() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active) return;

    active.clone().then((cloned: fabric.FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      this.setObjectId(cloned);
      this.canvas!.add(cloned);
      this.canvas!.setActiveObject(cloned);
      this.canvas!.requestRenderAll();
    });
  }

  async copyToClipboard() {
    if (!this.canvas) return;
    const activeObjects = this.canvas.getActiveObjects();
    this.clipboard = [];
    const promises = activeObjects.map((obj) =>
      obj.clone().then((cloned: fabric.FabricObject) => {
        this.clipboard.push(cloned);
      })
    );
    await Promise.all(promises);
  }

  pasteFromClipboard() {
    if (!this.canvas || this.clipboard.length === 0) return;

    this.canvas.discardActiveObject();
    const pastePromises = this.clipboard.map((obj) =>
      obj.clone().then((cloned: fabric.FabricObject) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        this.setObjectId(cloned);
        this.canvas!.add(cloned);
        return cloned;
      })
    );

    Promise.all(pastePromises).then((pasted) => {
      if (pasted.length === 1) {
        this.canvas!.setActiveObject(pasted[0]);
      } else if (pasted.length > 1) {
        const sel = new fabric.ActiveSelection(pasted, { canvas: this.canvas! });
        this.canvas!.setActiveObject(sel);
      }
      this.canvas!.requestRenderAll();
    });
  }

  // Alignment
  alignObjects(direction: string) {
    if (!this.canvas) return;
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    if (activeObject.type === 'activeSelection') {
      const selection = activeObject as fabric.ActiveSelection;
      const objects = selection.getObjects();
      const bound = selection.getBoundingRect();

      objects.forEach((obj) => {
        const objBound = obj.getBoundingRect();
        switch (direction) {
          case 'left':
            obj.set({ left: bound.left });
            break;
          case 'center-h':
            obj.set({ left: bound.left + (bound.width - objBound.width) / 2 });
            break;
          case 'right':
            obj.set({ left: bound.left + bound.width - objBound.width });
            break;
          case 'top':
            obj.set({ top: bound.top });
            break;
          case 'center-v':
            obj.set({ top: bound.top + (bound.height - objBound.height) / 2 });
            break;
          case 'bottom':
            obj.set({ top: bound.top + bound.height - objBound.height });
            break;
        }
        obj.setCoords();
      });
      this.canvas.requestRenderAll();
      this.saveHistory();
    }
  }

  distributeObjects(direction: 'horizontal' | 'vertical') {
    if (!this.canvas) return;
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'activeSelection') return;

    const selection = activeObject as fabric.ActiveSelection;
    const objects = [...selection.getObjects()];
    if (objects.length < 3) return;

    const bound = selection.getBoundingRect();

    if (direction === 'horizontal') {
      objects.sort((a, b) => (a.left || 0) - (b.left || 0));
      const totalWidth = objects.reduce((sum, obj) => sum + obj.getBoundingRect().width, 0);
      const spacing = (bound.width - totalWidth) / (objects.length - 1);
      let currentX = bound.left;

      objects.forEach((obj) => {
        obj.set({ left: currentX });
        obj.setCoords();
        currentX += obj.getBoundingRect().width + spacing;
      });
    } else {
      objects.sort((a, b) => (a.top || 0) - (b.top || 0));
      const totalHeight = objects.reduce((sum, obj) => sum + obj.getBoundingRect().height, 0);
      const spacing = (bound.height - totalHeight) / (objects.length - 1);
      let currentY = bound.top;

      objects.forEach((obj) => {
        obj.set({ top: currentY });
        obj.setCoords();
        currentY += obj.getBoundingRect().height + spacing;
      });
    }

    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  // Layer ordering
  bringForward() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.bringObjectForward(active);
      this.canvas.requestRenderAll();
    }
  }

  sendBackward() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.sendObjectBackwards(active);
      this.canvas.requestRenderAll();
    }
  }

  bringToFront() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.bringObjectToFront(active);
      this.canvas.requestRenderAll();
    }
  }

  sendToBack() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.sendObjectToBack(active);
      this.canvas.requestRenderAll();
    }
  }

  // Group/Ungroup
  groupSelected() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;

    const selection = active as fabric.ActiveSelection;
    const objects = selection.getObjects();

    // Remove from canvas first
    objects.forEach((obj) => this.canvas!.remove(obj));
    this.canvas.discardActiveObject();

    const group = new fabric.Group(objects);
    this.setObjectId(group);
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  ungroupSelected() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== 'group') return;

    const group = active as fabric.Group;
    const items = group.getObjects();

    this.canvas.remove(group);

    items.forEach((item) => {
      this.canvas!.add(item);
    });

    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  // Properties
  setSelectedFill(color: string) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      obj.set({ fill: color });
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedStroke(color: string) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      obj.set({ stroke: color });
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedStrokeWidth(width: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      obj.set({ strokeWidth: width });
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedOpacity(opacity: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      obj.set({ opacity });
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedCornerRadius(radius: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      if (obj.type === 'rect') {
        (obj as fabric.Rect).set({ rx: radius, ry: radius });
      }
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedShadow(shadow: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  } | null) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      if (shadow) {
        obj.set({
          shadow: new fabric.Shadow({
            color: shadow.color,
            blur: shadow.blur,
            offsetX: shadow.offsetX,
            offsetY: shadow.offsetY,
          }),
        });
      } else {
        obj.set({ shadow: undefined });
      }
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedFontSize(size: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      if (obj.type === 'i-text' || obj.type === 'textbox') {
        (obj as fabric.IText).set({ fontSize: size });
      }
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedFontFamily(family: string) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      if (obj.type === 'i-text' || obj.type === 'textbox') {
        (obj as fabric.IText).set({ fontFamily: family });
      }
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedFontWeight(weight: string) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      if (obj.type === 'i-text' || obj.type === 'textbox') {
        (obj as fabric.IText).set({ fontWeight: weight });
      }
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedFontStyle(style: string) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      if (obj.type === 'i-text' || obj.type === 'textbox') {
        (obj as fabric.IText).set({ fontStyle: style as '' | 'normal' | 'italic' | 'oblique' });
      }
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  setSelectedTextAlign(align: string) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    active.forEach((obj) => {
      if (obj.type === 'i-text' || obj.type === 'textbox') {
        (obj as fabric.IText).set({ textAlign: align });
      }
    });
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  // Gradient support
  setSelectedGradient(type: 'linear' | 'radial', stops: Array<{ offset: number; color: string }>, angle?: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();

    active.forEach((obj) => {
      const width = obj.width || 100;
      const height = obj.height || 100;

      const rad = ((angle || 0) * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const colorStops: Record<string, string> = {};
      stops.forEach((stop) => {
        colorStops[stop.offset.toString()] = stop.color;
      });

      if (type === 'linear') {
        const gradient = new fabric.Gradient({
          type: 'linear',
          coords: {
            x1: width / 2 - (cos * width) / 2,
            y1: height / 2 - (sin * height) / 2,
            x2: width / 2 + (cos * width) / 2,
            y2: height / 2 + (sin * height) / 2,
          },
          colorStops: stops.map((s) => ({ offset: s.offset, color: s.color, opacity: 1 })),
        });
        obj.set({ fill: gradient });
      } else {
        const gradient = new fabric.Gradient({
          type: 'radial',
          coords: {
            x1: width / 2,
            y1: height / 2,
            x2: width / 2,
            y2: height / 2,
            r1: 0,
            r2: Math.max(width, height) / 2,
          },
          colorStops: stops.map((s) => ({ offset: s.offset, color: s.color, opacity: 1 })),
        });
        obj.set({ fill: gradient });
      }
    });
    this.canvas.requestRenderAll();
  }

  // Export
  exportToPNG(multiplier: number = 2): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier,
    });
  }

  exportToSVG(): string {
    if (!this.canvas) return '';
    return this.canvas.toSVG();
  }

  exportToJSON(): string {
    if (!this.canvas) return '';
    return JSON.stringify((this.canvas as unknown as { toJSON(props: string[]): object }).toJSON(['id', 'customType', 'customName']), null, 2);
  }

  async importFromJSON(json: string) {
    if (!this.canvas) return;
    this.historyPaused = true;
    try {
      const parsed = JSON.parse(json);
      await this.canvas.loadFromJSON(parsed);
      this.canvas.requestRenderAll();
    } catch (err) {
      console.error('Failed to import JSON:', err);
    }
    this.historyPaused = false;
    this.saveHistory();
  }

  // Grid
  drawGrid(size: number, show: boolean) {
    if (!this.canvas) return;

    // Remove existing grid
    if (this.gridGroup) {
      this.canvas.remove(this.gridGroup);
      this.gridGroup = null;
    }

    if (!show) {
      this.canvas.requestRenderAll();
      return;
    }

    const width = this.canvas.width || 2000;
    const height = this.canvas.height || 2000;
    const lines: fabric.Line[] = [];

    for (let i = 0; i <= width / size; i++) {
      lines.push(
        new fabric.Line([i * size, 0, i * size, height], {
          stroke: '#e5e7eb',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
        })
      );
    }

    for (let i = 0; i <= height / size; i++) {
      lines.push(
        new fabric.Line([0, i * size, width, i * size], {
          stroke: '#e5e7eb',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
        })
      );
    }

    this.gridGroup = new fabric.Group(lines, {
      selectable: false,
      evented: false,
    });

    (this.gridGroup as fabric.FabricObject & { customType?: string }).customType = 'grid';

    this.canvas.add(this.gridGroup);
    this.canvas.sendObjectToBack(this.gridGroup);
    this.canvas.requestRenderAll();
  }

  // History
  saveHistory() {
    if (!this.canvas || this.historyPaused) return;
    const json = JSON.stringify((this.canvas as unknown as { toJSON(props: string[]): object }).toJSON(['id', 'customType', 'customName']));
    this.onHistoryPush?.(json);
  }

  async restoreFromHistory(json: string) {
    if (this._restoring) await this._restoring;
    this._restoring = this._doRestore(json);
    await this._restoring;
    this._restoring = null;
  }

  private async _doRestore(json: string) {
    if (!this.canvas) return;
    this.historyPaused = true;
    try {
      const parsed = JSON.parse(json);
      await this.canvas.loadFromJSON(parsed);
      this.canvas.requestRenderAll();
    } catch (err) {
      console.error('Failed to restore history:', err);
    }
    this.historyPaused = false;
  }

  // Zoom
  zoomIn() {
    if (!this.canvas) return;
    const zoom = Math.min(this.canvas.getZoom() * 1.2, 10);
    const center = new fabric.Point(
      (this.canvas.width || 0) / 2,
      (this.canvas.height || 0) / 2
    );
    this.canvas.zoomToPoint(center, zoom);
    this.onZoomChange?.(zoom);
  }

  zoomOut() {
    if (!this.canvas) return;
    const zoom = Math.max(this.canvas.getZoom() / 1.2, 0.1);
    const center = new fabric.Point(
      (this.canvas.width || 0) / 2,
      (this.canvas.height || 0) / 2
    );
    this.canvas.zoomToPoint(center, zoom);
    this.onZoomChange?.(zoom);
  }

  zoomToFit() {
    if (!this.canvas) return;
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.onZoomChange?.(1);
  }

  setZoom(zoom: number) {
    if (!this.canvas) return;
    const center = new fabric.Point(
      (this.canvas.width || 0) / 2,
      (this.canvas.height || 0) / 2
    );
    this.canvas.zoomToPoint(center, zoom);
    this.onZoomChange?.(zoom);
  }

  // Resize
  resize(width: number, height: number) {
    if (!this.canvas) return;
    this.canvas.setDimensions({ width, height });
    this.canvas.requestRenderAll();
  }

  // Get objects list for layers
  getObjectsList(): Array<{
    id: string;
    type: string;
    name: string;
    visible: boolean;
    locked: boolean;
  }> {
    if (!this.canvas) return [];
    return this.canvas
      .getObjects()
      .filter((obj) => (obj as fabric.FabricObject & { customType?: string }).customType !== 'grid')
      .map((obj, index) => {
        const typed = obj as fabric.FabricObject & { id?: string; customName?: string; customType?: string };
        return {
          id: typed.id || `obj-${index}`,
          type: typed.customType || obj.type || 'object',
          name: typed.customName || this.getObjectName(obj, index),
          visible: obj.visible !== false,
          locked: !obj.selectable,
        };
      })
      .reverse();
  }

  private getObjectName(obj: fabric.FabricObject, index: number): string {
    const typeNames: Record<string, string> = {
      rect: 'Rectangle',
      circle: 'Circle',
      ellipse: 'Ellipse',
      triangle: 'Triangle',
      polygon: 'Polygon',
      line: 'Line',
      'i-text': 'Text',
      textbox: 'Textbox',
      path: 'Path',
      image: 'Image',
      group: 'Group',
    };
    return `${typeNames[obj.type || ''] || 'Object'} ${index + 1}`;
  }

  selectObjectById(id: string) {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (obj) {
      this.canvas.setActiveObject(obj);
      this.canvas.requestRenderAll();
    }
  }

  toggleObjectVisibility(id: string) {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (obj) {
      obj.set({ visible: !obj.visible });
      this.canvas.requestRenderAll();
    }
  }

  toggleObjectLock(id: string) {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (obj) {
      const isLocked = !obj.selectable;
      obj.set({
        selectable: isLocked,
        evented: isLocked,
        lockMovementX: !isLocked,
        lockMovementY: !isLocked,
        lockRotation: !isLocked,
        lockScalingX: !isLocked,
        lockScalingY: !isLocked,
      });
      this.canvas.requestRenderAll();
    }
  }

  getSelectedObjectProperties(): Record<string, unknown> | null {
    if (!this.canvas) return null;
    const active = this.canvas.getActiveObject();
    if (!active) return null;

    return {
      type: active.type,
      left: Math.round(active.left || 0),
      top: Math.round(active.top || 0),
      width: Math.round((active.width || 0) * (active.scaleX || 1)),
      height: Math.round((active.height || 0) * (active.scaleY || 1)),
      angle: Math.round(active.angle || 0),
      fill: active.fill,
      stroke: active.stroke,
      strokeWidth: active.strokeWidth,
      opacity: active.opacity,
      rx: (active as fabric.Rect).rx,
      ry: (active as fabric.Rect).ry,
      fontSize: (active as fabric.IText).fontSize,
      fontFamily: (active as fabric.IText).fontFamily,
      fontWeight: (active as fabric.IText).fontWeight,
      fontStyle: (active as fabric.IText).fontStyle,
      textAlign: (active as fabric.IText).textAlign,
      shadow: active.shadow,
    };
  }

  setSelectedPosition(x: number, y: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active) {
      active.set({ left: x, top: y });
      active.setCoords();
      this.canvas.requestRenderAll();
    }
  }

  setSelectedSize(w: number, h: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active) {
      active.set({
        scaleX: w / (active.width || 1),
        scaleY: h / (active.height || 1),
      });
      active.setCoords();
      this.canvas.requestRenderAll();
    }
  }

  setSelectedAngle(angle: number) {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active) {
      active.set({ angle });
      active.setCoords();
      this.canvas.requestRenderAll();
    }
  }

  // Helpers
  private setObjectId(obj: fabric.FabricObject) {
    (obj as fabric.FabricObject & { id: string }).id = uuidv4();
  }

  private getCanvasCenter(): { x: number; y: number } {
    if (!this.canvas) return { x: 400, y: 300 };
    const vpt = this.canvas.viewportTransform!;
    const zoom = this.canvas.getZoom();
    return {
      x: ((this.canvas.width || 0) / 2 - vpt[4]) / zoom,
      y: ((this.canvas.height || 0) / 2 - vpt[5]) / zoom,
    };
  }

  selectAll() {
    if (!this.canvas) return;
    const objects = this.canvas.getObjects().filter(
      (obj) => (obj as fabric.FabricObject & { customType?: string }).customType !== 'grid'
    );
    if (objects.length === 0) return;
    const selection = new fabric.ActiveSelection(objects, { canvas: this.canvas });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
  }

  deselectAll() {
    if (!this.canvas) return;
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  setCanvasBackground(color: string) {
    if (!this.canvas) return;
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
  }

  destroy() {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }
}

// Singleton instance
export const canvasEngine = new CanvasEngine();
