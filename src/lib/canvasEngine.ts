import { Canvas, Rect, Circle, Ellipse, Triangle, Line, Textbox, Group, Path, Polygon, FabricObject, PencilBrush, CircleBrush, SprayBrush, Shadow, Gradient, Pattern, FabricImage, ActiveSelection, Point, util } from 'fabric'
import { v4 as uuidv4 } from 'uuid'

export class CanvasEngine {
  canvas: Canvas
  private clipboard: FabricObject[] | null = null
  private history: string[] = []
  private historyIndex = -1
  private maxHistory = 100
  private isLoadingHistory = false
  private gridLines: FabricObject[] = []
  private gridRenderHandler: (() => void) | null = null
  private gridSize: number = 20
  private guidelines: FabricObject[] = []
  private snapThreshold = 5
  private snapHandler: ((e: any) => void) | null = null
  private onSelectionChange?: (ids: string[]) => void
  private onObjectModified?: () => void
  private onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void
  private onZoomChange?: (zoom: number) => void
  private onViewportChange?: (zoom: number, panX: number, panY: number) => void

  constructor(canvasEl: HTMLCanvasElement, options?: {
    onSelectionChange?: (ids: string[]) => void
    onObjectModified?: () => void
    onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void
    onZoomChange?: (zoom: number) => void
    onViewportChange?: (zoom: number, panX: number, panY: number) => void
  }) {
    this.canvas = new Canvas(canvasEl, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f5f5f7',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      controlsAboveOverlay: true,
      allowTouchScrolling: true,
    })

    this.onSelectionChange = options?.onSelectionChange
    this.onObjectModified = options?.onObjectModified
    this.onHistoryChange = options?.onHistoryChange
    this.onZoomChange = options?.onZoomChange
    this.onViewportChange = options?.onViewportChange

    this.setupEventListeners()
    this.setupCustomControls()
    this.saveHistory()
  }

  private setupCustomControls() {
    FabricObject.prototype.set({
      cornerColor: '#0071e3',
      cornerStrokeColor: '#0071e3',
      cornerSize: 8,
      cornerStyle: 'circle',
      transparentCorners: false,
      borderColor: '#0071e3',
      borderScaleFactor: 1.5,
      padding: 0,
    })
  }

  private setupEventListeners() {
    this.canvas.on('selection:created', (e) => {
      this.handleSelectionChange()
    })
    this.canvas.on('selection:updated', (e) => {
      this.handleSelectionChange()
    })
    this.canvas.on('selection:cleared', () => {
      this.onSelectionChange?.([])
    })
    this.canvas.on('object:modified', () => {
      this.saveHistory()
      this.onObjectModified?.()
    })
    this.canvas.on('object:added', (e) => {
      if (!this.isLoadingHistory && !(e.target as any)?.isGrid) {
        this.saveHistory()
      }
    })
    this.canvas.on('object:removed', (e) => {
      if (!this.isLoadingHistory && !(e.target as any)?.isGrid) {
        this.saveHistory()
      }
    })

    // Zoom with scroll
    this.canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY
      let zoom = this.canvas.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      this.canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
      this.onZoomChange?.(zoom)
      const vpt = this.canvas.viewportTransform
      if (vpt) {
        this.onViewportChange?.(zoom, vpt[4], vpt[5])
      }
    })
  }

  private handleSelectionChange() {
    const active = this.canvas.getActiveObject()
    if (!active) {
      this.onSelectionChange?.([])
      return
    }
    if (active instanceof ActiveSelection) {
      const ids = active.getObjects().map(o => (o as any).id || '').filter(Boolean)
      this.onSelectionChange?.(ids)
    } else {
      const id = (active as any).id
      this.onSelectionChange?.(id ? [id] : [])
    }
  }

  // HISTORY
  private serializeCanvas(extraProps: string[] = []): string {
    const props = ['id', 'name', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls', 'visible', 'rx', 'ry', 'isFrame', 'isGrid', 'isPreview', ...extraProps]
    const data = this.canvas.toJSON(props)
    // Filter out grid lines and preview objects from serialization
    data.objects = (data.objects || []).filter((o: any) => !o.isGrid && !o.isPreview)
    return JSON.stringify(data)
  }

  saveHistory() {
    if (this.isLoadingHistory) return
    const json = this.serializeCanvas()
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }
    this.history.push(json)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
    this.historyIndex = this.history.length - 1
    this.onHistoryChange?.(this.canUndo(), this.canRedo())
  }

  canUndo() { return this.historyIndex > 0 }
  canRedo() { return this.historyIndex < this.history.length - 1 }

  async undo() {
    if (!this.canUndo()) return
    this.historyIndex--
    await this.loadFromHistory()
  }

  async redo() {
    if (!this.canRedo()) return
    this.historyIndex++
    await this.loadFromHistory()
  }

  private async loadFromHistory() {
    this.isLoadingHistory = true
    const json = this.history[this.historyIndex]
    await this.canvas.loadFromJSON(json)
    this.canvas.renderAll()
    this.isLoadingHistory = false
    this.onHistoryChange?.(this.canUndo(), this.canRedo())
  }

  // SHAPES
  addRect(options?: Partial<any>) {
    const id = uuidv4()
    const rect = new Rect({
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      width: 200,
      height: 150,
      fill: '#4A90D9',
      stroke: '',
      strokeWidth: 0,
      rx: 0,
      ry: 0,
      ...options,
    })
    ;(rect as any).id = id
    ;(rect as any).name = options?.name || 'Rectangle'
    this.canvas.add(rect)
    this.canvas.setActiveObject(rect)
    this.canvas.renderAll()
    return rect
  }

  addEllipse(options?: Partial<any>) {
    const id = uuidv4()
    const ellipse = new Ellipse({
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      rx: 75,
      ry: 50,
      fill: '#E86C6C',
      stroke: '',
      strokeWidth: 0,
      ...options,
    })
    ;(ellipse as any).id = id
    ;(ellipse as any).name = options?.name || 'Ellipse'
    this.canvas.add(ellipse)
    this.canvas.setActiveObject(ellipse)
    this.canvas.renderAll()
    return ellipse
  }

  addTriangle(options?: Partial<any>) {
    const id = uuidv4()
    const tri = new Triangle({
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      width: 150,
      height: 130,
      fill: '#50C878',
      stroke: '',
      strokeWidth: 0,
      ...options,
    })
    ;(tri as any).id = id
    ;(tri as any).name = options?.name || 'Triangle'
    this.canvas.add(tri)
    this.canvas.setActiveObject(tri)
    this.canvas.renderAll()
    return tri
  }

  addLine(options?: Partial<any>) {
    const id = uuidv4()
    const lx1 = options?.x1 ?? 100
    const ly1 = options?.y1 ?? 200
    const lx2 = options?.x2 ?? 350
    const ly2 = options?.y2 ?? 200
    const { x1: _x1, y1: _y1, x2: _x2, y2: _y2, ...restOptions } = options || {}
    const line = new Line([lx1, ly1, lx2, ly2], {
      stroke: '#1d1d1f',
      strokeWidth: 2,
      ...restOptions,
    })
    ;(line as any).id = id
    ;(line as any).name = restOptions?.name || 'Line'
    this.canvas.add(line)
    this.canvas.setActiveObject(line)
    this.canvas.renderAll()
    return line
  }

  addArrow(options?: Partial<any>) {
    const id = uuidv4()
    const headLen = 15
    const x1 = options?.x1 ?? 100
    const y1 = options?.y1 ?? 200
    const x2 = options?.x2 ?? (x1 + 250)
    const y2 = options?.y2 ?? y1
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const pathData = `M ${x1} ${y1} L ${x2} ${y2} M ${x2} ${y2} L ${x2 - headLen * Math.cos(angle - Math.PI / 6)} ${y2 - headLen * Math.sin(angle - Math.PI / 6)} M ${x2} ${y2} L ${x2 - headLen * Math.cos(angle + Math.PI / 6)} ${y2 - headLen * Math.sin(angle + Math.PI / 6)}`
    const { x1: _x1, y1: _y1, x2: _x2, y2: _y2, ...restOptions } = options || {}
    const arrow = new Path(pathData, {
      stroke: '#1d1d1f',
      strokeWidth: 2,
      fill: '',
      ...restOptions,
    })
    ;(arrow as any).id = id
    ;(arrow as any).name = restOptions?.name || 'Arrow'
    this.canvas.add(arrow)
    this.canvas.setActiveObject(arrow)
    this.canvas.renderAll()
    return arrow
  }

  addStar(options?: Partial<any>) {
    const id = uuidv4()
    const points = this.createStarPoints(5, 60, 30)
    const star = new Polygon(points, {
      left: 150 + Math.random() * 200,
      top: 150 + Math.random() * 200,
      fill: '#FFD700',
      stroke: '',
      strokeWidth: 0,
      ...options,
    })
    ;(star as any).id = id
    ;(star as any).name = options?.name || 'Star'
    this.canvas.add(star)
    this.canvas.setActiveObject(star)
    this.canvas.renderAll()
    return star
  }

  addPolygon(sides: number = 6, options?: Partial<any>) {
    const id = uuidv4()
    const points = this.createPolygonPoints(sides, 60)
    const poly = new Polygon(points, {
      left: 150 + Math.random() * 200,
      top: 150 + Math.random() * 200,
      fill: '#9B59B6',
      stroke: '',
      strokeWidth: 0,
      ...options,
    })
    ;(poly as any).id = id
    ;(poly as any).name = options?.name || `Polygon (${sides})`
    this.canvas.add(poly)
    this.canvas.setActiveObject(poly)
    this.canvas.renderAll()
    return poly
  }

  createStarPoints(spikes: number, outerR: number, innerR: number) {
    const points: { x: number; y: number }[] = []
    let rot = (Math.PI / 2) * 3
    const step = Math.PI / spikes
    for (let i = 0; i < spikes; i++) {
      points.push({ x: Math.cos(rot) * outerR, y: Math.sin(rot) * outerR })
      rot += step
      points.push({ x: Math.cos(rot) * innerR, y: Math.sin(rot) * innerR })
      rot += step
    }
    return points
  }

  createPolygonPoints(sides: number, radius: number) {
    const points: { x: number; y: number }[] = []
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
    }
    return points
  }

  // TEXT
  addText(options?: Partial<any>) {
    const id = uuidv4()
    const text = new Textbox('Type here', {
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      width: 200,
      fontSize: 20,
      fontFamily: 'Inter',
      fill: '#1d1d1f',
      editable: true,
      ...options,
    })
    ;(text as any).id = id
    ;(text as any).name = options?.name || 'Text'
    this.canvas.add(text)
    this.canvas.setActiveObject(text)
    this.canvas.renderAll()
    return text
  }

  // IMAGE
  async addImage(url: string, options?: Partial<any>) {
    return new Promise<FabricObject>((resolve) => {
      FabricImage.fromURL(url, {
        crossOrigin: 'anonymous',
        ...options,
      }).then((img) => {
        const id = uuidv4()
        ;(img as any).id = id
        ;(img as any).name = options?.name || 'Image'
        // Scale to reasonable size
        const maxDim = 400
        const scale = Math.min(maxDim / (img.width || 400), maxDim / (img.height || 400), 1)
        img.set({
          left: 100 + Math.random() * 200,
          top: 100 + Math.random() * 200,
          scaleX: scale,
          scaleY: scale,
          ...options,
        })
        this.canvas.add(img)
        this.canvas.setActiveObject(img)
        this.canvas.renderAll()
        resolve(img)
      })
    })
  }

  async addImageFromFile(file: File) {
    return new Promise<FabricObject>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        this.addImage(url, { name: file.name }).then(resolve)
      }
      reader.readAsDataURL(file)
    })
  }

  // FRAME
  addFrame(options?: Partial<any>) {
    const id = uuidv4()
    const frame = new Rect({
      left: 100,
      top: 100,
      width: 375,
      height: 812,
      fill: '#ffffff',
      stroke: '#e5e5e7',
      strokeWidth: 1,
      rx: 0,
      ry: 0,
      shadow: new Shadow({ color: 'rgba(0,0,0,0.08)', blur: 20, offsetX: 0, offsetY: 4 }),
      ...options,
    })
    ;(frame as any).id = id
    ;(frame as any).name = options?.name || 'Frame'
    ;(frame as any).isFrame = true
    this.canvas.add(frame)
    this.canvas.setActiveObject(frame)
    this.canvas.renderAll()
    return frame
  }

  // DRAWING MODE
  enableDrawingMode(type: 'pencil' | 'circle' | 'spray' | 'pen' = 'pencil', settings?: any) {
    this.canvas.isDrawingMode = true
    switch (type) {
      case 'circle':
        this.canvas.freeDrawingBrush = new CircleBrush(this.canvas)
        break
      case 'spray':
        this.canvas.freeDrawingBrush = new SprayBrush(this.canvas)
        break
      case 'pen':
        this.canvas.freeDrawingBrush = new PencilBrush(this.canvas)
        break
      default:
        this.canvas.freeDrawingBrush = new PencilBrush(this.canvas)
        break
    }
    if (this.canvas.freeDrawingBrush && settings) {
      this.canvas.freeDrawingBrush.width = settings.width || 3
      this.canvas.freeDrawingBrush.color = settings.color || '#1d1d1f'
      if (settings.shadowBlur) {
        this.canvas.freeDrawingBrush.shadow = new Shadow({
          blur: settings.shadowBlur,
          offsetX: 0,
          offsetY: 0,
          color: settings.shadowColor || 'rgba(0,0,0,0.3)',
        })
      }
    }
  }

  disableDrawingMode() {
    this.canvas.isDrawingMode = false
  }

  // ERASER - remove objects under pointer
  enableEraserMode() {
    this.canvas.isDrawingMode = false
    this.canvas.defaultCursor = 'crosshair'
    this.canvas.on('mouse:down', this.eraserHandler)
  }

  disableEraserMode() {
    this.canvas.defaultCursor = 'default'
    this.canvas.off('mouse:down', this.eraserHandler)
  }

  private eraserHandler = (opt: any) => {
    const pointer = this.canvas.getScenePoint(opt.e)
    const objects = this.canvas.getObjects()
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      if ((obj as any).isGrid) continue
      if (obj.containsPoint(pointer)) {
        this.canvas.remove(obj)
        this.canvas.renderAll()
        break
      }
    }
  }

  // GROUP / UNGROUP
  groupSelected() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return null
    const objects = active.getObjects()
    if (objects.length < 2) return null

    const group = new Group(objects, {})
    const id = uuidv4()
    ;(group as any).id = id
    ;(group as any).name = 'Group'

    // Remove objects and add group
    objects.forEach(o => this.canvas.remove(o))
    this.canvas.add(group)
    this.canvas.setActiveObject(group)
    this.canvas.renderAll()
    this.saveHistory()
    return group
  }

  ungroupSelected() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof Group)) return
    const items = active.getObjects().slice()
    // In Fabric.js v6, Group doesn't have destroy(). Just remove the group from canvas.
    this.canvas.remove(active)
    items.forEach(item => {
      this.canvas.add(item)
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // CLIPBOARD
  async copy() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const cloned = await active.clone()
    this.clipboard = [cloned]
  }

  async cut() {
    await this.copy()
    const active = this.canvas.getActiveObject()
    if (active) {
      if (active instanceof ActiveSelection) {
        active.getObjects().forEach(o => this.canvas.remove(o))
      } else {
        this.canvas.remove(active)
      }
      this.canvas.discardActiveObject()
      this.canvas.renderAll()
    }
  }

  async paste() {
    if (!this.clipboard || this.clipboard.length === 0) return
    for (const obj of this.clipboard) {
      const cloned = await obj.clone()
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      })
      ;(cloned as any).id = uuidv4()
      this.canvas.add(cloned)
      this.canvas.setActiveObject(cloned)
    }
    this.canvas.renderAll()
  }

  async duplicate() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const cloned = await active.clone()
    cloned.set({
      left: (cloned.left || 0) + 20,
      top: (cloned.top || 0) + 20,
    })
    ;(cloned as any).id = uuidv4()
    if (cloned instanceof ActiveSelection) {
      cloned.getObjects().forEach(o => {
        ;(o as any).id = uuidv4()
        this.canvas.add(o)
      })
    } else {
      this.canvas.add(cloned)
    }
    this.canvas.setActiveObject(cloned)
    this.canvas.renderAll()
  }

  // ALIGNMENT
  alignObjects(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof ActiveSelection) {
      const objects = active.getObjects()
      const bound = active.getBoundingRect()
      objects.forEach(obj => {
        const objBound = obj.getBoundingRect()
        switch (alignment) {
          case 'left':
            obj.set('left', bound.left)
            break
          case 'right':
            obj.set('left', bound.left + bound.width - objBound.width)
            break
          case 'center':
            obj.set('left', bound.left + (bound.width - objBound.width) / 2)
            break
          case 'top':
            obj.set('top', bound.top)
            break
          case 'bottom':
            obj.set('top', bound.top + bound.height - objBound.height)
            break
          case 'middle':
            obj.set('top', bound.top + (bound.height - objBound.height) / 2)
            break
        }
        obj.setCoords()
      })
      this.canvas.renderAll()
      this.saveHistory()
    }
  }

  distributeObjects(direction: 'horizontal' | 'vertical') {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 3) return

    if (direction === 'horizontal') {
      objects.sort((a, b) => (a.left || 0) - (b.left || 0))
      const first = objects[0]
      const last = objects[objects.length - 1]
      const totalWidth = (last.left || 0) + (last.width || 0) * (last.scaleX || 1) - (first.left || 0)
      const objWidths = objects.reduce((sum, o) => sum + (o.width || 0) * (o.scaleX || 1), 0)
      const spacing = (totalWidth - objWidths) / (objects.length - 1)
      let currentX = first.left || 0
      objects.forEach(obj => {
        obj.set('left', currentX)
        currentX += (obj.width || 0) * (obj.scaleX || 1) + spacing
        obj.setCoords()
      })
    } else {
      objects.sort((a, b) => (a.top || 0) - (b.top || 0))
      const first = objects[0]
      const last = objects[objects.length - 1]
      const totalHeight = (last.top || 0) + (last.height || 0) * (last.scaleY || 1) - (first.top || 0)
      const objHeights = objects.reduce((sum, o) => sum + (o.height || 0) * (o.scaleY || 1), 0)
      const spacing = (totalHeight - objHeights) / (objects.length - 1)
      let currentY = first.top || 0
      objects.forEach(obj => {
        obj.set('top', currentY)
        currentY += (obj.height || 0) * (obj.scaleY || 1) + spacing
        obj.setCoords()
      })
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // FLIP
  flipHorizontal() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('flipX', !active.flipX)
    this.canvas.renderAll()
    this.saveHistory()
  }

  flipVertical() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('flipY', !active.flipY)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // ORDERING
  bringToFront() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    this.canvas.bringObjectToFront(active)
    this.canvas.renderAll()
    this.saveHistory()
  }

  sendToBack() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    this.canvas.sendObjectToBack(active)
    this.canvas.renderAll()
    this.saveHistory()
  }

  bringForward() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    this.canvas.bringObjectForward(active)
    this.canvas.renderAll()
    this.saveHistory()
  }

  sendBackward() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    this.canvas.sendObjectBackwards(active)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // DELETE
  deleteSelected() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(o => this.canvas.remove(o))
    } else {
      this.canvas.remove(active)
    }
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
  }

  // SELECT ALL
  selectAll() {
    const objects = this.canvas.getObjects().filter(o => !(o as any).isGrid && o.selectable !== false)
    if (objects.length === 0) return
    const selection = new ActiveSelection(objects, { canvas: this.canvas })
    this.canvas.setActiveObject(selection)
    this.canvas.renderAll()
  }

  // ZOOM
  setZoom(zoom: number) {
    const center = this.canvas.getCenterPoint()
    this.canvas.zoomToPoint(center, zoom)
    this.canvas.renderAll()
    this.onZoomChange?.(zoom)
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      this.onViewportChange?.(zoom, vpt[4], vpt[5])
    }
  }

  zoomIn() {
    const zoom = Math.min(this.canvas.getZoom() * 1.2, 20)
    this.setZoom(zoom)
  }

  zoomOut() {
    const zoom = Math.max(this.canvas.getZoom() / 1.2, 0.01)
    this.setZoom(zoom)
  }

  zoomToFit() {
    const objects = this.canvas.getObjects().filter(o => !(o as any).isGrid)
    if (objects.length === 0) {
      this.setZoom(1)
      return
    }
    // Compute bounding rect of all objects without creating a temporary group
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const obj of objects) {
      const br = obj.getBoundingRect()
      minX = Math.min(minX, br.left)
      minY = Math.min(minY, br.top)
      maxX = Math.max(maxX, br.left + br.width)
      maxY = Math.max(maxY, br.top + br.height)
    }
    const bound = { left: minX, top: minY, width: maxX - minX, height: maxY - minY }

    const canvasW = this.canvas.getWidth()
    const canvasH = this.canvas.getHeight()
    const scaleX = canvasW / bound.width
    const scaleY = canvasH / bound.height
    const zoom = Math.min(scaleX, scaleY) * 0.8

    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    this.canvas.zoomToPoint(new Point(bound.left + bound.width / 2, bound.top + bound.height / 2), zoom)
    this.canvas.renderAll()
    this.onZoomChange?.(zoom)
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      this.onViewportChange?.(zoom, vpt[4], vpt[5])
    }
  }

  resetZoom() {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    this.canvas.renderAll()
    this.onZoomChange?.(1)
    this.onViewportChange?.(1, 0, 0)
  }

  // PAN (HAND TOOL)
  private isPanning = false
  private panStartPoint = { x: 0, y: 0 }

  enablePanMode() {
    this.canvas.defaultCursor = 'grab'
    this.canvas.on('mouse:down', this.panStartHandler)
    this.canvas.on('mouse:move', this.panMoveHandler)
    this.canvas.on('mouse:up', this.panEndHandler)
  }

  disablePanMode() {
    this.canvas.defaultCursor = 'default'
    this.canvas.off('mouse:down', this.panStartHandler)
    this.canvas.off('mouse:move', this.panMoveHandler)
    this.canvas.off('mouse:up', this.panEndHandler)
    this.isPanning = false
  }

  private panStartHandler = (opt: any) => {
    this.isPanning = true
    this.canvas.defaultCursor = 'grabbing'
    this.panStartPoint = { x: opt.e.clientX, y: opt.e.clientY }
    this.canvas.selection = false
  }

  private panMoveHandler = (opt: any) => {
    if (!this.isPanning) return
    const vpt = this.canvas.viewportTransform
    if (!vpt) return
    vpt[4] += opt.e.clientX - this.panStartPoint.x
    vpt[5] += opt.e.clientY - this.panStartPoint.y
    this.canvas.requestRenderAll()
    this.panStartPoint = { x: opt.e.clientX, y: opt.e.clientY }
    this.onViewportChange?.(this.canvas.getZoom(), vpt[4], vpt[5])
  }

  private panEndHandler = () => {
    this.isPanning = false
    this.canvas.defaultCursor = 'grab'
    this.canvas.selection = true
    this.canvas.setViewportTransform(this.canvas.viewportTransform!)
  }

  // GRID - rendered as overlay, not as canvas objects
  showGrid(size: number = 20) {
    this.clearGrid()
    this.gridSize = size
    this.gridRenderHandler = () => {
      const ctx = this.canvas.getContext()
      const vpt = this.canvas.viewportTransform
      if (!ctx || !vpt) return
      const zoom = this.canvas.getZoom()
      const width = this.canvas.getWidth()
      const height = this.canvas.getHeight()
      ctx.save()
      ctx.strokeStyle = '#e0e0e0'
      // Calculate visible area in canvas coordinates
      const startX = Math.floor(-vpt[4] / zoom / size) * size
      const startY = Math.floor(-vpt[5] / zoom / size) * size
      const endX = startX + Math.ceil(width / zoom / size) * size + size
      const endY = startY + Math.ceil(height / zoom / size) * size + size
      for (let x = startX; x <= endX; x += size) {
        ctx.lineWidth = (x % (size * 5) === 0 ? 0.5 : 0.2)
        ctx.beginPath()
        const screenX = x * zoom + vpt[4]
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, height)
        ctx.stroke()
      }
      for (let y = startY; y <= endY; y += size) {
        ctx.lineWidth = (y % (size * 5) === 0 ? 0.5 : 0.2)
        ctx.beginPath()
        const screenY = y * zoom + vpt[5]
        ctx.moveTo(0, screenY)
        ctx.lineTo(width, screenY)
        ctx.stroke()
      }
      ctx.restore()
    }
    this.canvas.on('after:render', this.gridRenderHandler)
    this.canvas.renderAll()
  }

  clearGrid() {
    if (this.gridRenderHandler) {
      this.canvas.off('after:render', this.gridRenderHandler)
      this.gridRenderHandler = null
    }
    this.gridLines.forEach(l => this.canvas.remove(l))
    this.gridLines = []
    this.canvas.renderAll()
  }

  // SNAP TO GRID
  enableSnapToGrid(size: number = 10) {
    this.disableSnapToGrid()
    this.snapHandler = (e: any) => {
      const obj = e.target
      if (!obj) return
      obj.set({
        left: Math.round(obj.left / size) * size,
        top: Math.round(obj.top / size) * size,
      })
    }
    this.canvas.on('object:moving', this.snapHandler)
  }

  disableSnapToGrid() {
    if (this.snapHandler) {
      this.canvas.off('object:moving', this.snapHandler)
      this.snapHandler = null
    }
  }

  // PROPERTY SETTERS
  setObjectFill(color: string) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(o => o.set('fill', color))
    } else {
      active.set('fill', color)
    }
    this.canvas.renderAll()
  }

  setObjectGradient(config: {
    type: 'linear' | 'radial',
    colorStops: Record<string, string>,
    coords?: any
  }) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const gradient = new Gradient({
      type: config.type,
      gradientUnits: 'percentage',
      coords: config.type === 'linear'
        ? { x1: 0, y1: 0, x2: 1, y2: 1, ...(config.coords || {}) }
        : { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.5, ...(config.coords || {}) },
      colorStops: Object.entries(config.colorStops).map(([offset, color]) => ({
        offset: parseFloat(offset),
        color,
      })),
    })
    active.set('fill', gradient)
    this.canvas.renderAll()
  }

  setObjectStroke(color: string, width?: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('stroke', color)
    if (width !== undefined) active.set('strokeWidth', width)
    this.canvas.renderAll()
  }

  setObjectStrokeDash(dashArray: number[]) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('strokeDashArray', dashArray)
    this.canvas.renderAll()
  }

  setStrokeLineCap(cap: CanvasLineCap) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('strokeLineCap', cap)
    this.canvas.renderAll()
  }

  setStrokeLineJoin(join: CanvasLineJoin) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('strokeLineJoin', join)
    this.canvas.renderAll()
  }

  // AUTO LAYOUT — arrange children of a group/frame
  autoLayoutChildren(direction: 'horizontal' | 'vertical' | 'wrap' | 'grid', gap: number = 10) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    // Works on Group or ActiveSelection
    const objects = 'getObjects' in active ? (active as any).getObjects() as any[] : []
    if (objects.length < 2) return
    let x = 0, y = 0
    const cols = direction === 'grid' ? Math.ceil(Math.sqrt(objects.length)) : objects.length
    const maxW = Math.max(...objects.map((obj: any) => (obj.width || 0) * (obj.scaleX || 1)))
    const maxH = Math.max(...objects.map((obj: any) => (obj.height || 0) * (obj.scaleY || 1)))
    objects.forEach((obj: any, i: number) => {
      const w = (obj.width || 0) * (obj.scaleX || 1)
      const h = (obj.height || 0) * (obj.scaleY || 1)
      if (direction === 'horizontal') {
        obj.set({ left: x, top: 0 }); x += w + gap
      } else if (direction === 'vertical') {
        obj.set({ left: 0, top: y }); y += h + gap
      } else if (direction === 'wrap') {
        obj.set({ left: x, top: y }); x += w + gap
        if (x > 600) { x = 0; y += h + gap }
      } else if (direction === 'grid') {
        const col = i % cols, row = Math.floor(i / cols)
        obj.set({ left: col * (maxW + gap), top: row * (maxH + gap) })
      }
      obj.setCoords()
    })
    this.canvas.renderAll()
  }

  // GENERATE CODE from selected object
  generateCodeExport(format: 'css' | 'svg' | 'react'): string {
    const active = this.canvas.getActiveObject()
    if (!active) return '// No object selected'
    const props = this.getActiveObjectProps()
    if (!props) return '// No object selected'
    if (format === 'svg') {
      return active.toSVG() || '<!-- Could not generate SVG -->'
    }
    if (format === 'css') {
      const lines: string[] = ['.element {']
      lines.push(`  position: absolute;`)
      lines.push(`  left: ${props.left}px;`)
      lines.push(`  top: ${props.top}px;`)
      lines.push(`  width: ${props.width}px;`)
      lines.push(`  height: ${props.height}px;`)
      if (props.angle) lines.push(`  transform: rotate(${props.angle}deg);`)
      if (props.opacity !== undefined && props.opacity !== 1) lines.push(`  opacity: ${props.opacity};`)
      if (typeof props.fill === 'string') lines.push(`  background-color: ${props.fill};`)
      if (props.stroke && props.strokeWidth) {
        lines.push(`  border: ${props.strokeWidth}px solid ${props.stroke};`)
      }
      if (props.rx) lines.push(`  border-radius: ${props.rx}px;`)
      if (props.isText) {
        if (props.fontFamily) lines.push(`  font-family: '${props.fontFamily}';`)
        if (props.fontSize) lines.push(`  font-size: ${props.fontSize}px;`)
        if (props.fontWeight && props.fontWeight !== 'normal') lines.push(`  font-weight: ${props.fontWeight};`)
        if (props.fontStyle === 'italic') lines.push(`  font-style: italic;`)
        if (props.textAlign) lines.push(`  text-align: ${props.textAlign};`)
        if (props.lineHeight) lines.push(`  line-height: ${props.lineHeight};`)
        const decorations: string[] = []
        if (props.underline) decorations.push('underline')
        if (props.linethrough) decorations.push('line-through')
        if (decorations.length > 0) lines.push(`  text-decoration: ${decorations.join(' ')};`)
      }
      lines.push('}')
      return lines.join('\n')
    }
    // React / JSX
    const style: string[] = []
    style.push(`position: 'absolute'`)
    style.push(`left: ${props.left}`)
    style.push(`top: ${props.top}`)
    style.push(`width: ${props.width}`)
    style.push(`height: ${props.height}`)
    if (props.angle) style.push(`transform: 'rotate(${props.angle}deg)'`)
    if (props.opacity !== undefined && props.opacity !== 1) style.push(`opacity: ${props.opacity}`)
    if (typeof props.fill === 'string') style.push(`backgroundColor: '${props.fill}'`)
    if (props.stroke && props.strokeWidth) style.push(`border: '${props.strokeWidth}px solid ${props.stroke}'`)
    if (props.rx) style.push(`borderRadius: ${props.rx}`)
    if (props.isText) {
      if (props.fontFamily) style.push(`fontFamily: '${props.fontFamily}'`)
      if (props.fontSize) style.push(`fontSize: ${props.fontSize}`)
      if (props.fontWeight && props.fontWeight !== 'normal') style.push(`fontWeight: '${props.fontWeight}'`)
      if (props.fontStyle === 'italic') style.push(`fontStyle: 'italic'`)
      if (props.textAlign) style.push(`textAlign: '${props.textAlign}'`)
    }
    const isText = active instanceof Textbox
    const tag = isText ? 'p' : 'div'
    const content = isText ? (active as any).text || '' : ''
    return `<${tag} style={{ ${style.join(', ')} }}>${content ? `\n  ${content}\n` : ''}</${tag}>`
  }

  // STROKE POSITION (inside / center / outside)
  setStrokePosition(position: 'center' | 'inside' | 'outside') {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any)._strokePosition = position
    if (position === 'inside') {
      active.set('paintFirst', 'fill')
      active.set('strokeUniform', true)
    } else if (position === 'outside') {
      active.set('paintFirst', 'stroke')
      active.set('strokeUniform', true)
    } else {
      active.set('paintFirst', 'fill')
      active.set('strokeUniform', false)
    }
    this.canvas.renderAll()
  }

  // BLEND MODES
  setBlendMode(mode: string) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).globalCompositeOperation = mode
    this.canvas.renderAll()
  }

  // INDIVIDUAL CORNER RADIUS
  setIndividualCornerRadius(corners: { tl: number, tr: number, br: number, bl: number }) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof Rect)) return
    const w = active.width || 100
    const h = active.height || 100
    const { tl, tr, br, bl } = corners
    // Store individual corners as custom property
    ;(active as any)._cornerRadii = corners
    // Reset uniform rx/ry to 0 — we handle rounding via clipPath
    active.set('rx', 0)
    active.set('ry', 0)
    // Build an SVG path with individual corner radii and apply as clipPath
    const pathData = this.buildRoundedRectPath(w, h, tl, tr, br, bl)
    const clipPath = new Path(pathData, {
      left: -w / 2,
      top: -h / 2,
      originX: 'left',
      originY: 'top',
    })
    active.set('clipPath', clipPath)
    this.canvas.renderAll()
  }

  // Build an SVG path string for a rect with individual corner radii
  private buildRoundedRectPath(w: number, h: number, tl: number, tr: number, br: number, bl: number): string {
    // Clamp radii to half of the smallest dimension
    const maxR = Math.min(w, h) / 2
    tl = Math.min(tl, maxR)
    tr = Math.min(tr, maxR)
    br = Math.min(br, maxR)
    bl = Math.min(bl, maxR)
    return [
      `M ${tl} 0`,
      `L ${w - tr} 0`,
      `Q ${w} 0 ${w} ${tr}`,
      `L ${w} ${h - br}`,
      `Q ${w} ${h} ${w - br} ${h}`,
      `L ${bl} ${h}`,
      `Q 0 ${h} 0 ${h - bl}`,
      `L 0 ${tl}`,
      `Q 0 0 ${tl} 0`,
      'Z',
    ].join(' ')
  }

  setObjectOpacity(opacity: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('opacity', opacity)
    this.canvas.renderAll()
  }

  setObjectShadow(config: { color: string, blur: number, offsetX: number, offsetY: number }) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('shadow', new Shadow(config))
    this.canvas.renderAll()
  }

  removeShadow() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('shadow', null)
    this.canvas.renderAll()
  }

  // INNER SHADOW (simulated via shadow + clip)
  setInnerShadow(config: { color: string, blur: number, offsetX: number, offsetY: number }) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    // Store inner shadow config as custom property
    ;(active as any)._innerShadow = config
    // Apply as inverted shadow for visual effect
    active.set('shadow', new Shadow({
      color: config.color,
      blur: config.blur,
      offsetX: config.offsetX,
      offsetY: config.offsetY,
      affectStroke: false,
    }))
    this.canvas.renderAll()
  }

  // LAYER BLUR
  setLayerBlur(blur: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (blur > 0) {
      ;(active as any)._blurAmount = blur
      // Use Fabric.js filters for images
      if (active instanceof FabricImage) {
        const blurFilter = new (FabricImage.filters as any).Blur({ blur: blur / 100 })
        active.filters = [blurFilter]
        active.applyFilters()
      } else {
        // For non-image objects, store the blur value
        ;(active as any)._blurAmount = blur
      }
    } else {
      ;(active as any)._blurAmount = 0
      if (active instanceof FabricImage) {
        active.filters = []
        active.applyFilters()
      }
    }
    this.canvas.renderAll()
  }

  setCornerRadius(rx: number, ry?: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof Rect) {
      active.set('rx', rx)
      active.set('ry', ry ?? rx)
      ;(active as any)._cornerRadii = null // Clear individual corners when setting uniform
      active.set('clipPath', undefined) // Remove per-corner clipPath
      this.canvas.renderAll()
    }
  }

  setObjectPosition(left: number, top: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ left, top })
    active.setCoords()
    this.canvas.renderAll()
  }

  setObjectSize(width: number, height: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({
      scaleX: width / (active.width || 1),
      scaleY: height / (active.height || 1),
    })
    active.setCoords()
    this.canvas.renderAll()
  }

  setObjectRotation(angle: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('angle', angle)
    active.setCoords()
    this.canvas.renderAll()
  }

  // TEXT PROPERTIES
  setTextProperty(prop: string, value: any) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof Textbox)) return
    active.set(prop as any, value)
    this.canvas.renderAll()
  }

  // LOCK / UNLOCK
  lockObject(lock: boolean) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({
      lockMovementX: lock,
      lockMovementY: lock,
      lockRotation: lock,
      lockScalingX: lock,
      lockScalingY: lock,
      hasControls: !lock,
      selectable: !lock,
      evented: !lock,
    })
    this.canvas.renderAll()
  }

  // VISIBILITY
  toggleVisibility(objectId: string) {
    const obj = this.canvas.getObjects().find(o => (o as any).id === objectId)
    if (!obj) return
    obj.set('visible', !obj.visible)
    this.canvas.renderAll()
  }

  // GET OBJECTS LIST (for layers)
  getObjectsList(): Array<{ id: string, name: string, type: string, visible: boolean, locked: boolean }> {
    return this.canvas.getObjects()
      .filter(o => !(o as any).isGrid && !(o as any).isPreview)
      .map(o => ({
        id: (o as any).id || '',
        name: (o as any).name || o.type || 'Object',
        type: o.type || 'object',
        visible: o.visible !== false,
        locked: o.lockMovementX === true,
      }))
      .reverse()
  }

  // GET ACTIVE OBJECT PROPERTIES
  getActiveObjectProps(): Record<string, any> | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    const props: Record<string, any> = {
      id: (active as any).id,
      name: (active as any).name,
      type: active.type,
      left: Math.round(active.left || 0),
      top: Math.round(active.top || 0),
      width: Math.round((active.width || 0) * (active.scaleX || 1)),
      height: Math.round((active.height || 0) * (active.scaleY || 1)),
      angle: Math.round(active.angle || 0),
      opacity: active.opacity,
      fill: active.fill,
      stroke: active.stroke,
      strokeWidth: active.strokeWidth,
      strokeDashArray: active.strokeDashArray,
      flipX: active.flipX,
      flipY: active.flipY,
      shadow: active.shadow,
      visible: active.visible,
      locked: active.lockMovementX,
      blendMode: (active as any).globalCompositeOperation || 'source-over',
      strokePosition: (active as any)._strokePosition || 'center',
      cornerRadii: (active as any)._cornerRadii || null,
      blurAmount: (active as any)._blurAmount || 0,
      innerShadow: (active as any)._innerShadow || null,
      isImage: active instanceof FabricImage,
    }
    if (active instanceof Rect) {
      props.rx = (active as any).rx || 0
      props.ry = (active as any).ry || 0
      props.isRect = true
    }
    if (active instanceof Textbox) {
      props.isText = true
      props.fontFamily = active.fontFamily
      props.fontSize = active.fontSize
      props.fontWeight = active.fontWeight
      props.fontStyle = active.fontStyle
      props.underline = active.underline
      props.linethrough = active.linethrough
      props.overline = active.overline
      props.textAlign = active.textAlign
      props.lineHeight = active.lineHeight
      props.charSpacing = active.charSpacing
      props.text = active.text
      props.splitByGrapheme = (active as any).splitByGrapheme || false
    }
    // Stroke line cap / join
    props.strokeLineCap = active.strokeLineCap || 'butt'
    props.strokeLineJoin = active.strokeLineJoin || 'miter'
    return props
  }

  // SELECT OBJECT BY ID
  selectObjectById(id: string) {
    const obj = this.canvas.getObjects().find(o => (o as any).id === id)
    if (obj) {
      this.canvas.setActiveObject(obj)
      this.canvas.renderAll()
    }
  }

  // RENAME OBJECT
  renameObject(id: string, name: string) {
    const obj = this.canvas.getObjects().find(o => (o as any).id === id)
    if (obj) {
      ;(obj as any).name = name
    }
  }

  // REORDER OBJECTS
  moveObjectToIndex(id: string, index: number) {
    const obj = this.canvas.getObjects().find(o => (o as any).id === id)
    if (obj) {
      this.canvas.remove(obj)
      const objects = this.canvas.getObjects()
      const targetIndex = objects.length - index
      this.canvas.insertAt(targetIndex, obj)
      this.canvas.renderAll()
    }
  }

  // Helper to get bounding box of all visible objects (excludes background)
  private getObjectsBoundingBox(): { left: number, top: number, width: number, height: number } | null {
    const objects = this.canvas.getObjects().filter((o: any) => !o.isPreview && !o.isGrid)
    if (objects.length === 0) return null

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const obj of objects) {
      const bound = obj.getBoundingRect()
      minX = Math.min(minX, bound.left)
      minY = Math.min(minY, bound.top)
      maxX = Math.max(maxX, bound.left + bound.width)
      maxY = Math.max(maxY, bound.top + bound.height)
    }

    // Add small padding (4px)
    const pad = 4
    return {
      left: minX - pad,
      top: minY - pad,
      width: (maxX - minX) + pad * 2,
      height: (maxY - minY) + pad * 2,
    }
  }

  // EXPORT
  exportToPNG(scale: number = 2, selectedOnly: boolean = false): string {
    if (selectedOnly) {
      const active = this.canvas.getActiveObject()
      if (active) {
        return active.toDataURL({ format: 'png', multiplier: scale } as any)
      }
    }
    // Export only the bounding box of all objects (not the full canvas)
    const bbox = this.getObjectsBoundingBox()
    if (!bbox) {
      return this.canvas.toDataURL({ format: 'png', multiplier: scale })
    }
    // Temporarily hide background, export the region, restore
    const origBg = this.canvas.backgroundColor
    this.canvas.backgroundColor = 'transparent'
    this.canvas.renderAll()
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      multiplier: scale,
      left: bbox.left,
      top: bbox.top,
      width: bbox.width,
      height: bbox.height,
    })
    this.canvas.backgroundColor = origBg
    this.canvas.renderAll()
    return dataURL
  }

  exportToSVG(): string {
    return this.canvas.toSVG()
  }

  exportToJPG(quality: number = 0.92, scale: number = 2): string {
    // Export only the bounding box of all objects
    const bbox = this.getObjectsBoundingBox()
    if (!bbox) {
      return this.canvas.toDataURL({ format: 'jpeg', quality, multiplier: scale })
    }
    // Use white background for JPG (no transparency)
    const origBg = this.canvas.backgroundColor
    this.canvas.backgroundColor = '#ffffff'
    this.canvas.renderAll()
    const dataURL = this.canvas.toDataURL({
      format: 'jpeg',
      quality,
      multiplier: scale,
      left: bbox.left,
      top: bbox.top,
      width: bbox.width,
      height: bbox.height,
    })
    this.canvas.backgroundColor = origBg
    this.canvas.renderAll()
    return dataURL
  }

  exportToJSON(): string {
    return this.serializeCanvas(['globalCompositeOperation', 'paintFirst', 'strokeUniform'])
  }

  async loadFromJSON(json: string) {
    await this.canvas.loadFromJSON(json)
    // Clean up any grid lines that were accidentally serialized by older versions
    const staleGridLines = this.canvas.getObjects().filter(o =>
      (o as any).isGrid ||
      (o.type === 'line' && !o.selectable && !o.evented && o.stroke === '#e0e0e0')
    )
    staleGridLines.forEach(o => this.canvas.remove(o))
    this.canvas.renderAll()
    this.saveHistory()
  }

  // CLEAR CANVAS
  clearCanvas() {
    this.canvas.clear()
    this.canvas.backgroundColor = '#f5f5f7'
    this.canvas.renderAll()
    this.saveHistory()
  }

  // RESIZE
  resize(width: number, height: number) {
    this.canvas.setDimensions({ width, height })
    this.canvas.renderAll()
  }

  // BOOLEAN OPERATIONS
  booleanUnion() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    // Create a group from all selected objects (visual union)
    const group = new Group([...objects], {})
    const id = uuidv4()
    ;(group as any).id = id
    ;(group as any).name = 'Union'
    objects.forEach(o => this.canvas.remove(o))
    this.canvas.add(group)
    this.canvas.setActiveObject(group)
    this.canvas.renderAll()
    this.saveHistory()
  }

  booleanSubtract() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    // Use the first object as base, clip with second
    const base = objects[0]
    const clipper = objects[1]
    const clipperClone = new Rect({
      left: (clipper.left || 0) - (base.left || 0),
      top: (clipper.top || 0) - (base.top || 0),
      width: (clipper.width || 0) * (clipper.scaleX || 1),
      height: (clipper.height || 0) * (clipper.scaleY || 1),
      absolutePositioned: false,
      inverted: true,
    })
    base.set('clipPath', clipperClone)
    ;(base as any).name = 'Subtract'
    this.canvas.remove(clipper)
    this.canvas.discardActiveObject()
    this.canvas.setActiveObject(base)
    this.canvas.renderAll()
    this.saveHistory()
  }

  booleanIntersect() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    const base = objects[0]
    const clipper = objects[1]
    const clipperClone = new Rect({
      left: (clipper.left || 0) - (base.left || 0),
      top: (clipper.top || 0) - (base.top || 0),
      width: (clipper.width || 0) * (clipper.scaleX || 1),
      height: (clipper.height || 0) * (clipper.scaleY || 1),
      absolutePositioned: false,
    })
    base.set('clipPath', clipperClone)
    ;(base as any).name = 'Intersect'
    this.canvas.remove(clipper)
    this.canvas.discardActiveObject()
    this.canvas.setActiveObject(base)
    this.canvas.renderAll()
    this.saveHistory()
  }

  booleanExclude() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    // Exclude = symmetric difference (areas in either shape but not both)
    // Approximate by grouping both with inverted clipPaths of each other
    const base = objects[0]
    const cutter = objects[1]
    // Clone base clipped by inverted cutter
    const clipForBase = new Rect({
      left: (cutter.left || 0) - (base.left || 0),
      top: (cutter.top || 0) - (base.top || 0),
      width: (cutter.width || 0) * (cutter.scaleX || 1),
      height: (cutter.height || 0) * (cutter.scaleY || 1),
      absolutePositioned: false,
      inverted: true,
    })
    base.set('clipPath', clipForBase)
    // Clone cutter clipped by inverted base
    const clipForCutter = new Rect({
      left: (base.left || 0) - (cutter.left || 0),
      top: (base.top || 0) - (cutter.top || 0),
      width: (base.width || 0) * (base.scaleX || 1),
      height: (base.height || 0) * (base.scaleY || 1),
      absolutePositioned: false,
      inverted: true,
    })
    cutter.set('clipPath', clipForCutter)
    // Group both clipped shapes
    const group = new Group([base, cutter], {})
    const id = uuidv4()
    ;(group as any).id = id
    ;(group as any).name = 'Exclude'
    objects.forEach(o => this.canvas.remove(o))
    this.canvas.add(group)
    this.canvas.setActiveObject(group)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // MASKING - use top object as mask for bottom
  applyMask() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    // Last object is the mask shape, apply to first object
    const target = objects[0]
    const mask = objects[objects.length - 1]
    const maskClone = new Rect({
      left: (mask.left || 0) - (target.left || 0),
      top: (mask.top || 0) - (target.top || 0),
      width: (mask.width || 0) * (mask.scaleX || 1),
      height: (mask.height || 0) * (mask.scaleY || 1),
      absolutePositioned: false,
    })
    target.set('clipPath', maskClone)
    ;(target as any).name = (target as any).name || 'Masked'
    this.canvas.remove(mask)
    this.canvas.discardActiveObject()
    this.canvas.setActiveObject(target)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // REMOVE MASK / CLIP
  removeMask() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('clipPath', undefined)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // IMAGE CROP - enter crop mode by applying clipPath
  cropImage(cropRect: { left: number, top: number, width: number, height: number }) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof FabricImage)) return
    const clip = new Rect({
      left: cropRect.left,
      top: cropRect.top,
      width: cropRect.width,
      height: cropRect.height,
      absolutePositioned: false,
    })
    active.set('clipPath', clip)
    this.canvas.renderAll()
    this.saveHistory()
  }

  resetCrop() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof FabricImage)) return
    active.set('clipPath', undefined)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // FLATTEN / RASTERIZE selected object
  async flattenSelected() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const dataURL = active.toDataURL({ format: 'png', multiplier: 2 } as any)
    const img = await FabricImage.fromURL(dataURL, { crossOrigin: 'anonymous' })
    const id = uuidv4()
    ;(img as any).id = id
    ;(img as any).name = 'Flattened'
    img.set({
      left: active.left,
      top: active.top,
    })
    this.canvas.remove(active)
    this.canvas.add(img)
    this.canvas.setActiveObject(img)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // EXPORT SELECTED OBJECT
  exportSelectedToPNG(scale: number = 2): string | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    return active.toDataURL({ format: 'png', multiplier: scale } as any)
  }

  exportSelectedToSVG(): string | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    return active.toSVG()
  }

  exportSelectedToJPG(scale: number = 2, quality: number = 0.92): string | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    return active.toDataURL({ format: 'jpeg', quality, multiplier: scale } as any)
  }

  // EYEDROPPER
  getColorAtPoint(x: number, y: number): string {
    const el = (this.canvas as any).lowerCanvasEl as HTMLCanvasElement
    if (!el) return '#000000'
    const ctx = el.getContext('2d')
    if (!ctx) return '#000000'
    // Account for device pixel ratio
    const dpr = window.devicePixelRatio || 1
    const px = Math.round(x * dpr)
    const py = Math.round(y * dpr)
    const pixel = ctx.getImageData(px, py, 1, 1).data
    // Convert to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`
  }

  // DISPOSE
  dispose() {
    this.canvas.dispose()
  }
}
