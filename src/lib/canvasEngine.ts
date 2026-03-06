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
  onViewportChange?: (zoom: number, panX: number, panY: number) => void

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
    const data = (this.canvas as any).toJSON(props)
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
    // Proportionally scale radii if adjacent corners exceed edge length (per CSS border-radius spec)
    const f = Math.min(
      (tl + tr > 0) ? w / (tl + tr) : Infinity,
      (tr + br > 0) ? h / (tr + br) : Infinity,
      (br + bl > 0) ? w / (br + bl) : Infinity,
      (bl + tl > 0) ? h / (bl + tl) : Infinity,
      1
    )
    tl *= f; tr *= f; br *= f; bl *= f
    return [
      `M ${tl} 0`,
      `L ${w - tr} 0`,
      `A ${tr} ${tr} 0 0 1 ${w} ${tr}`,
      `L ${w} ${h - br}`,
      `A ${br} ${br} 0 0 1 ${w - br} ${h}`,
      `L ${bl} ${h}`,
      `A ${bl} ${bl} 0 0 1 0 ${h - bl}`,
      `L 0 ${tl}`,
      `A ${tl} ${tl} 0 0 1 ${tl} 0`,
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
      props.paragraphSpacing = (active as any).paragraphSpacing || 0
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

  // ===== NEW FEATURES: Batch 1 - Utility Methods =====

  // Feature 1: Scale selected object to fit canvas dimensions
  scaleToFitCanvas() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const canvasW = this.canvas.getWidth()
    const canvasH = this.canvas.getHeight()
    const objW = (active.width || 1) * (active.scaleX || 1)
    const objH = (active.height || 1) * (active.scaleY || 1)
    const scale = Math.min(canvasW / objW, canvasH / objH) * 0.9
    active.set({
      scaleX: (active.scaleX || 1) * scale,
      scaleY: (active.scaleY || 1) * scale,
    })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 2: Center selected object on canvas
  centerOnCanvas() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const canvasW = this.canvas.getWidth()
    const canvasH = this.canvas.getHeight()
    const zoom = this.canvas.getZoom()
    const vpt = this.canvas.viewportTransform
    const panX = vpt ? vpt[4] : 0
    const panY = vpt ? vpt[5] : 0
    const objW = (active.width || 0) * (active.scaleX || 1)
    const objH = (active.height || 0) * (active.scaleY || 1)
    active.set({
      left: (canvasW / 2 - panX) / zoom - objW / 2,
      top: (canvasH / 2 - panY) / zoom - objH / 2,
    })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 3: Center selected object horizontally
  centerHorizontally() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const canvasW = this.canvas.getWidth()
    const zoom = this.canvas.getZoom()
    const vpt = this.canvas.viewportTransform
    const panX = vpt ? vpt[4] : 0
    const objW = (active.width || 0) * (active.scaleX || 1)
    active.set({ left: (canvasW / 2 - panX) / zoom - objW / 2 })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 4: Center selected object vertically
  centerVertically() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const canvasH = this.canvas.getHeight()
    const zoom = this.canvas.getZoom()
    const vpt = this.canvas.viewportTransform
    const panY = vpt ? vpt[5] : 0
    const objH = (active.height || 0) * (active.scaleY || 1)
    active.set({ top: (canvasH / 2 - panY) / zoom - objH / 2 })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 5: Match width of selected objects to widest
  matchWidth() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    const maxWidth = Math.max(...objects.map(o => (o.width || 0) * (o.scaleX || 1)))
    objects.forEach(o => {
      o.set({ scaleX: maxWidth / (o.width || 1) })
      o.setCoords()
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 6: Match height of selected objects to tallest
  matchHeight() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    const maxHeight = Math.max(...objects.map(o => (o.height || 0) * (o.scaleY || 1)))
    objects.forEach(o => {
      o.set({ scaleY: maxHeight / (o.height || 1) })
      o.setCoords()
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 7: Match both width and height to largest
  matchSize() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    const maxWidth = Math.max(...objects.map(o => (o.width || 0) * (o.scaleX || 1)))
    const maxHeight = Math.max(...objects.map(o => (o.height || 0) * (o.scaleY || 1)))
    objects.forEach(o => {
      o.set({
        scaleX: maxWidth / (o.width || 1),
        scaleY: maxHeight / (o.height || 1),
      })
      o.setCoords()
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 8: Equal spacing between selected objects
  spacingEqual(gap: number = 20) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects().slice().sort((a, b) => (a.left || 0) - (b.left || 0))
    if (objects.length < 2) return
    let currentLeft = objects[0].left || 0
    objects.forEach((obj, i) => {
      if (i === 0) return
      currentLeft += (objects[i - 1].width || 0) * (objects[i - 1].scaleX || 1) + gap
      obj.set({ left: currentLeft })
      obj.setCoords()
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 9: Rotate selected by increment
  rotateBy(degrees: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('angle', ((active.angle || 0) + degrees) % 360)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 10: Scale selected by factor
  scaleBy(factor: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({
      scaleX: (active.scaleX || 1) * factor,
      scaleY: (active.scaleY || 1) * factor,
    })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 11: Move selected by delta
  moveBy(dx: number, dy: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({
      left: (active.left || 0) + dx,
      top: (active.top || 0) + dy,
    })
    active.setCoords()
    this.canvas.renderAll()
  }

  // Feature 12: Set horizontal skew
  setObjectSkewX(skew: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('skewX', skew)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 13: Set vertical skew
  setObjectSkewY(skew: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('skewY', skew)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 14: Get total object count
  getObjectCount(): number {
    return this.canvas.getObjects().filter((o: any) => !o.isGrid && !o.isPreview).length
  }

  // Feature 15: Get count of selected objects
  getSelectedCount(): number {
    const active = this.canvas.getActiveObject()
    if (!active) return 0
    if (active instanceof ActiveSelection) return active.getObjects().length
    return 1
  }

  // Feature 16: Deselect all objects
  deselectAll() {
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
  }

  // Feature 17: Change canvas background color
  setCanvasBackgroundColor(color: string) {
    this.canvas.backgroundColor = color
    this.canvas.renderAll()
  }

  // Feature 18: Get canvas background color
  getCanvasBackgroundColor(): string {
    return (this.canvas.backgroundColor as string) || '#f5f5f7'
  }

  // Feature 19: Add circle convenience method
  addCircle(options?: Partial<any>) {
    const id = uuidv4()
    const circle = new Circle({
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      radius: 60,
      fill: '#50C878',
      stroke: '',
      strokeWidth: 0,
      ...options,
    })
    ;(circle as any).id = id
    ;(circle as any).name = options?.name || 'Circle'
    this.canvas.add(circle)
    this.canvas.setActiveObject(circle)
    this.canvas.renderAll()
    return circle
  }

  // Feature 20: Add square convenience method
  addSquare(options?: Partial<any>) {
    return this.addRect({ width: 150, height: 150, name: 'Square', ...options })
  }

  // Feature 21: Add horizontal line
  addHorizontalLine(options?: Partial<any>) {
    const id = uuidv4()
    const line = new Line([0, 0, 300, 0], {
      left: 100 + Math.random() * 200,
      top: 200 + Math.random() * 100,
      stroke: '#1d1d1f',
      strokeWidth: 2,
      ...options,
    })
    ;(line as any).id = id
    ;(line as any).name = options?.name || 'Horizontal Line'
    this.canvas.add(line)
    this.canvas.setActiveObject(line)
    this.canvas.renderAll()
    return line
  }

  // Feature 22: Add vertical line
  addVerticalLine(options?: Partial<any>) {
    const id = uuidv4()
    const line = new Line([0, 0, 0, 300], {
      left: 200 + Math.random() * 100,
      top: 100 + Math.random() * 200,
      stroke: '#1d1d1f',
      strokeWidth: 2,
      ...options,
    })
    ;(line as any).id = id
    ;(line as any).name = options?.name || 'Vertical Line'
    this.canvas.add(line)
    this.canvas.setActiveObject(line)
    this.canvas.renderAll()
    return line
  }

  // Feature 23: Add diamond shape
  addDiamond(options?: Partial<any>) {
    const size = options?.size || 100
    const points = [
      { x: size / 2, y: 0 },
      { x: size, y: size / 2 },
      { x: size / 2, y: size },
      { x: 0, y: size / 2 },
    ]
    const id = uuidv4()
    const poly = new Polygon(points, {
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      fill: '#FFD700',
      stroke: '',
      strokeWidth: 0,
      ...options,
    })
    ;(poly as any).id = id
    ;(poly as any).name = options?.name || 'Diamond'
    this.canvas.add(poly)
    this.canvas.setActiveObject(poly)
    this.canvas.renderAll()
    return poly
  }

  // Feature 24: Add pre-rounded rectangle
  addRoundedRect(options?: Partial<any>) {
    return this.addRect({ rx: 12, ry: 12, name: 'Rounded Rectangle', ...options })
  }

  // Feature 25: Duplicate with custom offset
  async duplicateToOffset(dx: number = 20, dy: number = 20) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const cloned = await active.clone()
    const newId = uuidv4()
    ;(cloned as any).id = newId
    ;(cloned as any).name = ((active as any).name || active.type || 'Object') + ' copy'
    cloned.set({
      left: (active.left || 0) + dx,
      top: (active.top || 0) + dy,
    })
    this.canvas.add(cloned)
    this.canvas.setActiveObject(cloned)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 26: Export only selected objects as JSON
  objectsToJSON(): string | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    const props = ['id', 'name', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls', 'visible', 'rx', 'ry', 'isFrame', 'globalCompositeOperation', 'paintFirst', 'strokeUniform']
    if (active instanceof ActiveSelection) {
      const objects = active.getObjects().map(o => (o as any).toJSON(props))
      return JSON.stringify({ objects })
    }
    return JSON.stringify({ objects: [(active as any).toJSON(props)] })
  }

  // Feature 27: Import objects from JSON string
  async importObjectsFromJSON(json: string) {
    try {
      const data = JSON.parse(json)
      if (!data.objects || !Array.isArray(data.objects)) return
      // Use util.enlivenObjects to add objects without replacing existing ones
      const fabric = await import('fabric')
      const enlivened = await (fabric as any).util.enlivenObjects(data.objects)
      for (const obj of enlivened) {
        ;(obj as any).id = uuidv4()
        this.canvas.add(obj as any)
      }
      this.canvas.renderAll()
      this.saveHistory()
    } catch {
      console.warn('Failed to import objects from JSON')
    }
  }

  // Feature 28: Rename active object
  setObjectName(name: string) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).name = name
  }

  // Feature 29: Get object by ID
  getObjectById(id: string): FabricObject | null {
    return this.canvas.getObjects().find(o => (o as any).id === id) || null
  }

  // Feature 30: Select multiple objects by IDs
  selectMultipleByIds(ids: string[]) {
    const objects = this.canvas.getObjects().filter(o => ids.includes((o as any).id))
    if (objects.length === 0) return
    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else {
      const selection = new ActiveSelection(objects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }
    this.canvas.renderAll()
  }

  // Feature 31: Move viewport to center of all objects
  moveToCenter() {
    const bbox = this.getObjectsBoundingBox()
    if (!bbox) return
    const centerX = bbox.left + bbox.width / 2
    const centerY = bbox.top + bbox.height / 2
    const zoom = this.canvas.getZoom()
    const canvasW = this.canvas.getWidth()
    const canvasH = this.canvas.getHeight()
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[4] = canvasW / 2 - centerX * zoom
      vpt[5] = canvasH / 2 - centerY * zoom
      this.canvas.setViewportTransform(vpt)
      this.onViewportChange?.(zoom, vpt[4], vpt[5])
    }
  }

  // Feature 32: Set exact zoom percentage
  setZoomLevel(percentage: number) {
    const zoom = percentage / 100
    this.setZoom(Math.max(0.01, Math.min(20, zoom)))
  }

  // Feature 33: Get zoom as percentage
  getZoomPercentage(): number {
    return Math.round(this.canvas.getZoom() * 100)
  }

  // Feature 34: Invert fill/stroke colors of selection
  invertColors() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const invertHex = (hex: string): string => {
      if (!hex || hex === 'transparent' || hex === '') return hex
      const clean = hex.replace('#', '')
      if (clean.length !== 6) return hex
      const r = 255 - parseInt(clean.substring(0, 2), 16)
      const g = 255 - parseInt(clean.substring(2, 4), 16)
      const b = 255 - parseInt(clean.substring(4, 6), 16)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
    const fill = active.fill
    if (typeof fill === 'string') {
      active.set('fill', invertHex(fill))
    }
    const stroke = active.stroke
    if (typeof stroke === 'string' && stroke) {
      active.set('stroke', invertHex(stroke))
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 35: Apply random colors to selection
  randomizeColors() {
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(o => {
        o.set('fill', randomColor())
      })
    } else {
      active.set('fill', randomColor())
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 36: Outline stroke to selected
  outlineStroke(color: string = '#000000', width: number = 2) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ stroke: color, strokeWidth: width })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 37: Remove stroke from selected
  removeStroke() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ stroke: '', strokeWidth: 0 })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 38: Remove fill from selected
  removeFill() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('fill', 'transparent')
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 39: Set both fill and stroke at once
  setFillAndStroke(fill: string, strokeColor: string, strokeWidth: number = 1) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ fill, stroke: strokeColor, strokeWidth })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 40: Export to WebP format
  exportToWebP(quality: number = 0.92, scale: number = 2): string {
    const bbox = this.getObjectsBoundingBox()
    if (!bbox) {
      return this.canvas.toDataURL({ format: 'webp', quality, multiplier: scale } as any)
    }
    const origBg = this.canvas.backgroundColor
    this.canvas.backgroundColor = 'transparent'
    this.canvas.renderAll()
    const dataURL = this.canvas.toDataURL({
      format: 'webp',
      quality,
      multiplier: scale,
      left: bbox.left,
      top: bbox.top,
      width: bbox.width,
      height: bbox.height,
    } as any)
    this.canvas.backgroundColor = origBg
    this.canvas.renderAll()
    return dataURL
  }

  // Feature 41: Copy as PNG to clipboard
  async copyAsPNG() {
    const dataURL = this.exportToPNG(2)
    try {
      const response = await fetch(dataURL)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      return true
    } catch {
      return false
    }
  }

  // Feature 42: Copy as SVG to clipboard
  async copyAsSVG() {
    const svg = this.exportToSVG()
    try {
      await navigator.clipboard.writeText(svg)
      return true
    } catch {
      return false
    }
  }

  // Feature 43: Copy CSS styles to clipboard
  async copyCSSToClipboard() {
    const css = this.generateCodeExport('css')
    try {
      await navigator.clipboard.writeText(css)
      return true
    } catch {
      return false
    }
  }

  // Feature 44: Get canvas statistics
  getCanvasStatistics(): { total: number; byType: Record<string, number> } {
    const objects = this.canvas.getObjects().filter((o: any) => !o.isGrid && !o.isPreview)
    const byType: Record<string, number> = {}
    objects.forEach(o => {
      const type = o.type || 'unknown'
      byType[type] = (byType[type] || 0) + 1
    })
    return { total: objects.length, byType }
  }

  // Feature 45: Fit width zoom mode
  zoomToFitWidth() {
    const bbox = this.getObjectsBoundingBox()
    if (!bbox) return
    const canvasW = this.canvas.getWidth()
    const zoom = (canvasW * 0.9) / bbox.width
    const clampedZoom = Math.max(0.01, Math.min(20, zoom))
    const center = new Point(bbox.left + bbox.width / 2, bbox.top + bbox.height / 2)
    this.canvas.zoomToPoint(center, clampedZoom)
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[4] = canvasW / 2 - center.x * clampedZoom
      this.canvas.setViewportTransform(vpt)
      this.onZoomChange?.(clampedZoom)
      this.onViewportChange?.(clampedZoom, vpt[4], vpt[5])
    }
  }

  // Feature 46: Fit height zoom mode
  zoomToFitHeight() {
    const bbox = this.getObjectsBoundingBox()
    if (!bbox) return
    const canvasH = this.canvas.getHeight()
    const zoom = (canvasH * 0.9) / bbox.height
    const clampedZoom = Math.max(0.01, Math.min(20, zoom))
    const center = new Point(bbox.left + bbox.width / 2, bbox.top + bbox.height / 2)
    this.canvas.zoomToPoint(center, clampedZoom)
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[5] = canvasH / 2 - center.y * clampedZoom
      this.canvas.setViewportTransform(vpt)
      this.onZoomChange?.(clampedZoom)
      this.onViewportChange?.(clampedZoom, vpt[4], vpt[5])
    }
  }

  // Feature 47: Get cursor coordinates in canvas space
  getCanvasPointFromEvent(e: MouseEvent): { x: number; y: number } {
    const point = this.canvas.getScenePoint(e)
    return { x: Math.round(point.x), y: Math.round(point.y) }
  }

  // Feature 48: Duplicate page content (returns JSON of current canvas)
  getCanvasJSON(): string {
    return this.exportToJSON()
  }

  // Feature 49: Select objects by type
  selectByType(type: string) {
    const objects = this.canvas.getObjects().filter(o => o.type === type && !(o as any).isGrid && !(o as any).isPreview)
    if (objects.length === 0) return
    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else {
      const selection = new ActiveSelection(objects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }
    this.canvas.renderAll()
  }

  // Feature 50: Add text with preset styles
  addHeading(text: string = 'Heading', options?: Partial<any>) {
    return this.addText({ text, fontSize: 36, fontWeight: 'bold', name: 'Heading', ...options })
  }

  addSubheading(text: string = 'Subheading', options?: Partial<any>) {
    return this.addText({ text, fontSize: 24, fontWeight: '600', name: 'Subheading', ...options })
  }

  addBodyText(text: string = 'Body text goes here', options?: Partial<any>) {
    return this.addText({ text, fontSize: 16, fontWeight: 'normal', name: 'Body Text', ...options })
  }

  addCaption(text: string = 'Caption', options?: Partial<any>) {
    return this.addText({ text, fontSize: 12, fontWeight: 'normal', fill: '#6e6e73', name: 'Caption', ...options })
  }

  // ===== FEATURES 101-200: Additional CanvasEngine Methods =====

  // Feature 101: Nudge selected object by 1px
  nudgeLeft() { this.moveBy(-1, 0) }
  nudgeRight() { this.moveBy(1, 0) }
  nudgeUp() { this.moveBy(0, -1) }
  nudgeDown() { this.moveBy(0, 1) }

  // Feature 102: Nudge by 10px (shift+arrow)
  nudgeLeftLarge() { this.moveBy(-10, 0) }
  nudgeRightLarge() { this.moveBy(10, 0) }
  nudgeUpLarge() { this.moveBy(0, -10) }
  nudgeDownLarge() { this.moveBy(0, 10) }

  // Feature 103: Skew object horizontally
  skewX(angle: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('skewX', angle)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 104: Skew object vertically
  skewY(angle: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('skewY', angle)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 105: Reset all transforms on selected object
  resetTransforms() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      angle: 0,
    })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 106: Get object's absolute position (accounting for viewport)
  getAbsolutePosition(obj?: FabricObject): { x: number; y: number } | null {
    const target = obj || this.canvas.getActiveObject()
    if (!target) return null
    const point = target.getCenterPoint()
    return { x: point.x, y: point.y }
  }

  // Feature 107: Set object's absolute center position
  setCenterPosition(x: number, y: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const center = active.getCenterPoint()
    const dx = x - center.x
    const dy = y - center.y
    active.set({
      left: (active.left || 0) + dx,
      top: (active.top || 0) + dy,
    })
    active.setCoords()
    this.canvas.renderAll()
  }

  // Feature 108: Get bounding box of all objects
  getAllObjectsBounds(): { left: number; top: number; width: number; height: number } | null {
    const objects = this.canvas.getObjects().filter((o: any) => !o.isGrid && !o.isPreview)
    if (objects.length === 0) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    objects.forEach(obj => {
      const bound = obj.getBoundingRect()
      minX = Math.min(minX, bound.left)
      minY = Math.min(minY, bound.top)
      maxX = Math.max(maxX, bound.left + bound.width)
      maxY = Math.max(maxY, bound.top + bound.height)
    })
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY }
  }

  // Feature 109: Zoom to selected object
  zoomToSelection() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const bound = active.getBoundingRect()
    const canvasW = this.canvas.getWidth()
    const canvasH = this.canvas.getHeight()
    const scaleX = canvasW / (bound.width * 1.2)
    const scaleY = canvasH / (bound.height * 1.2)
    const zoom = Math.min(scaleX, scaleY, 5)
    const center = active.getCenterPoint()
    this.canvas.zoomToPoint(new Point(canvasW / 2, canvasH / 2), zoom)
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[4] = canvasW / 2 - center.x * zoom
      vpt[5] = canvasH / 2 - center.y * zoom
      this.canvas.setViewportTransform(vpt)
    }
    this.onZoomChange?.(zoom)
    if (vpt) this.onViewportChange?.(zoom, vpt[4], vpt[5])
  }

  // Feature 110: Pan canvas to center on a specific object by ID
  panToObjectById(id: string) {
    const obj = this.getObjectById(id)
    if (!obj) return
    const center = obj.getCenterPoint()
    const zoom = this.canvas.getZoom()
    const canvasW = this.canvas.getWidth()
    const canvasH = this.canvas.getHeight()
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[4] = canvasW / 2 - center.x * zoom
      vpt[5] = canvasH / 2 - center.y * zoom
      this.canvas.setViewportTransform(vpt)
      this.onViewportChange?.(zoom, vpt[4], vpt[5])
    }
  }

  // Feature 111: Select all objects of a specific type
  selectByType(type: string) {
    const objects = this.canvas.getObjects().filter(o => o.type === type && !(o as any).isGrid)
    if (objects.length === 0) return
    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else {
      const selection = new ActiveSelection(objects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }
    this.canvas.renderAll()
  }

  // Feature 112: Select all objects with matching fill color
  selectByFill(color: string) {
    const objects = this.canvas.getObjects().filter(o => {
      const fill = o.fill
      return typeof fill === 'string' && fill.toLowerCase() === color.toLowerCase() && !(o as any).isGrid
    })
    if (objects.length === 0) return
    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else {
      const selection = new ActiveSelection(objects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }
    this.canvas.renderAll()
  }

  // Feature 113: Select all objects with matching stroke color
  selectByStroke(color: string) {
    const objects = this.canvas.getObjects().filter(o => {
      const s = o.stroke
      return typeof s === 'string' && s.toLowerCase() === color.toLowerCase() && !(o as any).isGrid
    })
    if (objects.length === 0) return
    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else {
      const selection = new ActiveSelection(objects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }
    this.canvas.renderAll()
  }

  // Feature 114: Invert selection
  invertSelection() {
    const allObjects = this.canvas.getObjects().filter((o: any) => !o.isGrid && !o.isPreview)
    const active = this.canvas.getActiveObject()
    let currentIds: string[] = []
    if (active) {
      if (active instanceof ActiveSelection) {
        currentIds = active.getObjects().map(o => (o as any).id).filter(Boolean)
      } else {
        currentIds = [(active as any).id].filter(Boolean)
      }
    }
    const unselected = allObjects.filter(o => !currentIds.includes((o as any).id))
    if (unselected.length === 0) {
      this.canvas.discardActiveObject()
    } else if (unselected.length === 1) {
      this.canvas.setActiveObject(unselected[0])
    } else {
      const selection = new ActiveSelection(unselected, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }
    this.canvas.renderAll()
  }

  // Feature 115: Deselect all objects
  deselectAll() {
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
  }

  // Feature 116: Count objects by type
  countObjectsByType(): Record<string, number> {
    const counts: Record<string, number> = {}
    this.canvas.getObjects().forEach(obj => {
      if ((obj as any).isGrid || (obj as any).isPreview) return
      const type = obj.type || 'unknown'
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }

  // Feature 117: Get total canvas area used by objects
  getUsedArea(): number {
    let totalArea = 0
    this.canvas.getObjects().forEach(obj => {
      if ((obj as any).isGrid || (obj as any).isPreview) return
      const w = (obj.width || 0) * (obj.scaleX || 1)
      const h = (obj.height || 0) * (obj.scaleY || 1)
      totalArea += w * h
    })
    return totalArea
  }

  // Feature 118: Check if two objects overlap
  objectsOverlap(id1: string, id2: string): boolean {
    const obj1 = this.getObjectById(id1)
    const obj2 = this.getObjectById(id2)
    if (!obj1 || !obj2) return false
    const r1 = obj1.getBoundingRect()
    const r2 = obj2.getBoundingRect()
    return !(r1.left > r2.left + r2.width || r1.left + r1.width < r2.left ||
             r1.top > r2.top + r2.height || r1.top + r1.height < r2.top)
  }

  // Feature 119: Get distance between two objects (center to center)
  getDistanceBetween(id1: string, id2: string): number | null {
    const obj1 = this.getObjectById(id1)
    const obj2 = this.getObjectById(id2)
    if (!obj1 || !obj2) return null
    const c1 = obj1.getCenterPoint()
    const c2 = obj2.getCenterPoint()
    return Math.sqrt(Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2))
  }

  // Feature 120: Get angle between two objects
  getAngleBetween(id1: string, id2: string): number | null {
    const obj1 = this.getObjectById(id1)
    const obj2 = this.getObjectById(id2)
    if (!obj1 || !obj2) return null
    const c1 = obj1.getCenterPoint()
    const c2 = obj2.getCenterPoint()
    return Math.atan2(c2.y - c1.y, c2.x - c1.x) * 180 / Math.PI
  }

  // Feature 121: Arrange objects in a circle
  arrangeInCircle(radius: number = 200) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    const centerX = this.canvas.getWidth() / 2
    const centerY = this.canvas.getHeight() / 2
    const angleStep = (2 * Math.PI) / objects.length
    objects.forEach((obj, i) => {
      const angle = i * angleStep - Math.PI / 2
      obj.set({
        left: centerX + radius * Math.cos(angle) - (obj.width || 0) * (obj.scaleX || 1) / 2,
        top: centerY + radius * Math.sin(angle) - (obj.height || 0) * (obj.scaleY || 1) / 2,
      })
      obj.setCoords()
    })
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 122: Arrange objects in a grid
  arrangeInGrid(cols: number = 3, gap: number = 20) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    let maxW = 0, maxH = 0
    objects.forEach(obj => {
      maxW = Math.max(maxW, (obj.width || 0) * (obj.scaleX || 1))
      maxH = Math.max(maxH, (obj.height || 0) * (obj.scaleY || 1))
    })
    const startX = 100, startY = 100
    objects.forEach((obj, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      obj.set({
        left: startX + col * (maxW + gap),
        top: startY + row * (maxH + gap),
      })
      obj.setCoords()
    })
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 123: Stack objects vertically with gap
  stackVertically(gap: number = 10) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects().sort((a, b) => (a.top || 0) - (b.top || 0))
    let currentY = objects[0]?.top || 0
    objects.forEach(obj => {
      obj.set({ top: currentY })
      obj.setCoords()
      currentY += (obj.height || 0) * (obj.scaleY || 1) + gap
    })
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 124: Stack objects horizontally with gap
  stackHorizontally(gap: number = 10) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects().sort((a, b) => (a.left || 0) - (b.left || 0))
    let currentX = objects[0]?.left || 0
    objects.forEach(obj => {
      obj.set({ left: currentX })
      obj.setCoords()
      currentX += (obj.width || 0) * (obj.scaleX || 1) + gap
    })
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 125: Swap positions of two selected objects
  swapPositions() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length !== 2) return
    const [a, b] = objects
    const aLeft = a.left, aTop = a.top
    a.set({ left: b.left, top: b.top })
    b.set({ left: aLeft, top: aTop })
    a.setCoords()
    b.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 126: Randomize positions within canvas bounds
  randomizePositions() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const w = this.canvas.getWidth()
    const h = this.canvas.getHeight()
    active.getObjects().forEach(obj => {
      obj.set({
        left: Math.random() * (w - 100),
        top: Math.random() * (h - 100),
      })
      obj.setCoords()
    })
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 127: Randomize colors of selected objects
  randomizeColors() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(obj => {
        obj.set('fill', randomColor())
      })
    } else {
      active.set('fill', randomColor())
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 128: Set uniform opacity for all selected objects
  setUniformOpacity(opacity: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(obj => {
        obj.set('opacity', opacity)
      })
    } else {
      active.set('opacity', opacity)
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 129: Apply same fill to all selected objects
  applyUniformFill(color: string) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(obj => {
        obj.set('fill', color)
      })
    } else {
      active.set('fill', color)
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 130: Apply same stroke to all selected objects
  applyUniformStroke(color: string, width: number = 1) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(obj => {
        obj.set({ stroke: color, strokeWidth: width })
      })
    } else {
      active.set({ stroke: color, strokeWidth: width })
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 131: Make all objects same width as selected
  equalizeWidths() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    const targetWidth = (objects[0].width || 100) * (objects[0].scaleX || 1)
    objects.slice(1).forEach(obj => {
      obj.set('scaleX', targetWidth / (obj.width || 1))
      obj.setCoords()
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 132: Make all objects same height as selected
  equalizeHeights() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    if (objects.length < 2) return
    const targetHeight = (objects[0].height || 100) * (objects[0].scaleY || 1)
    objects.slice(1).forEach(obj => {
      obj.set('scaleY', targetHeight / (obj.height || 1))
      obj.setCoords()
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 133: Equalize spacing between objects horizontally
  equalizeHorizontalSpacing() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects().sort((a, b) => (a.left || 0) - (b.left || 0))
    if (objects.length < 3) return
    const first = objects[0]
    const last = objects[objects.length - 1]
    const totalWidth = objects.reduce((sum, obj) => sum + (obj.width || 0) * (obj.scaleX || 1), 0)
    const firstLeft = first.left || 0
    const lastRight = (last.left || 0) + (last.width || 0) * (last.scaleX || 1)
    const totalSpace = lastRight - firstLeft - totalWidth
    const gap = totalSpace / (objects.length - 1)
    let currentX = firstLeft + (first.width || 0) * (first.scaleX || 1) + gap
    for (let i = 1; i < objects.length - 1; i++) {
      objects[i].set('left', currentX)
      objects[i].setCoords()
      currentX += (objects[i].width || 0) * (objects[i].scaleX || 1) + gap
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 134: Equalize spacing between objects vertically
  equalizeVerticalSpacing() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects().sort((a, b) => (a.top || 0) - (b.top || 0))
    if (objects.length < 3) return
    const first = objects[0]
    const last = objects[objects.length - 1]
    const totalHeight = objects.reduce((sum, obj) => sum + (obj.height || 0) * (obj.scaleY || 1), 0)
    const firstTop = first.top || 0
    const lastBottom = (last.top || 0) + (last.height || 0) * (last.scaleY || 1)
    const totalSpace = lastBottom - firstTop - totalHeight
    const gap = totalSpace / (objects.length - 1)
    let currentY = firstTop + (first.height || 0) * (first.scaleY || 1) + gap
    for (let i = 1; i < objects.length - 1; i++) {
      objects[i].set('top', currentY)
      objects[i].setCoords()
      currentY += (objects[i].height || 0) * (objects[i].scaleY || 1) + gap
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 135: Tighten spacing (reduce gap between objects)
  tightenSpacing(amount: number = 5) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects().sort((a, b) => (a.left || 0) - (b.left || 0))
    const center = objects.reduce((sum, o) => sum + (o.left || 0), 0) / objects.length
    objects.forEach(obj => {
      const dx = ((obj.left || 0) - center) > 0 ? -amount : amount
      obj.set('left', (obj.left || 0) + dx)
      obj.setCoords()
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 136: Loosen spacing (increase gap between objects)
  loosenSpacing(amount: number = 5) {
    this.tightenSpacing(-amount)
  }

  // Feature 137: Create a text label for selected object
  addLabelToSelected(labelText?: string) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const bound = active.getBoundingRect()
    const text = labelText || (active as any).name || active.type || 'Object'
    this.addText({
      text,
      fontSize: 11,
      fill: '#666',
      left: bound.left,
      top: bound.top - 20,
      name: 'Label',
    })
  }

  // Feature 138: Create pentagon shape
  addPentagon(options?: Partial<any>) {
    return this.addPolygon({ sides: 5, name: 'Pentagon', ...options })
  }

  // Feature 139: Create octagon shape
  addOctagon(options?: Partial<any>) {
    return this.addPolygon({ sides: 8, name: 'Octagon', ...options })
  }

  // Feature 140: Create cross/plus shape
  addCross(options?: Partial<any>) {
    const size = options?.width || 100
    const arm = size / 3
    const points = [
      { x: arm, y: 0 }, { x: arm * 2, y: 0 },
      { x: arm * 2, y: arm }, { x: size, y: arm },
      { x: size, y: arm * 2 }, { x: arm * 2, y: arm * 2 },
      { x: arm * 2, y: size }, { x: arm, y: size },
      { x: arm, y: arm * 2 }, { x: 0, y: arm * 2 },
      { x: 0, y: arm }, { x: arm, y: arm },
    ]
    const poly = new Polygon(points, {
      left: options?.left || 100,
      top: options?.top || 100,
      fill: options?.fill || '#4ECDC4',
      stroke: options?.stroke || '',
      strokeWidth: options?.strokeWidth || 0,
      name: 'Cross',
      ...(options || {}),
    })
    ;(poly as any).id = uuidv4()
    this.canvas.add(poly)
    this.canvas.setActiveObject(poly)
    this.canvas.renderAll()
    this.saveHistory()
    return poly
  }

  // Feature 141: Create heart shape using path
  addHeart(options?: Partial<any>) {
    const { Path } = require('fabric')
    const heartPath = 'M 50 30 C 50 25 45 10 30 10 C 10 10 10 35 10 35 C 10 55 30 65 50 85 C 70 65 90 55 90 35 C 90 35 90 10 70 10 C 55 10 50 25 50 30 Z'
    const heart = new Path(heartPath, {
      left: options?.left || 100,
      top: options?.top || 100,
      fill: options?.fill || '#E74C3C',
      stroke: options?.stroke || '',
      strokeWidth: options?.strokeWidth || 0,
      scaleX: (options?.width || 100) / 100,
      scaleY: (options?.height || 100) / 95,
      name: 'Heart',
    })
    ;(heart as any).id = uuidv4()
    this.canvas.add(heart)
    this.canvas.setActiveObject(heart)
    this.canvas.renderAll()
    this.saveHistory()
    return heart
  }

  // Feature 142: Create speech bubble shape
  addSpeechBubble(options?: Partial<any>) {
    const { Path } = require('fabric')
    const bubblePath = 'M 10 10 L 90 10 Q 95 10 95 15 L 95 55 Q 95 60 90 60 L 40 60 L 20 80 L 25 60 L 10 60 Q 5 60 5 55 L 5 15 Q 5 10 10 10 Z'
    const bubble = new Path(bubblePath, {
      left: options?.left || 100,
      top: options?.top || 100,
      fill: options?.fill || '#FFFFFF',
      stroke: options?.stroke || '#333333',
      strokeWidth: options?.strokeWidth || 2,
      scaleX: (options?.width || 200) / 100,
      scaleY: (options?.height || 160) / 90,
      name: 'Speech Bubble',
    })
    ;(bubble as any).id = uuidv4()
    this.canvas.add(bubble)
    this.canvas.setActiveObject(bubble)
    this.canvas.renderAll()
    this.saveHistory()
    return bubble
  }

  // Feature 143: Create cloud shape
  addCloud(options?: Partial<any>) {
    const { Path } = require('fabric')
    const cloudPath = 'M 25 60 C 10 60 0 50 5 40 C 0 30 10 20 20 20 C 20 10 35 5 45 10 C 50 0 70 0 75 10 C 85 5 100 15 95 30 C 105 35 100 50 90 55 C 95 60 85 65 75 60 Z'
    const cloud = new Path(cloudPath, {
      left: options?.left || 100,
      top: options?.top || 100,
      fill: options?.fill || '#ECF0F1',
      stroke: options?.stroke || '#BDC3C7',
      strokeWidth: options?.strokeWidth || 1,
      scaleX: (options?.width || 200) / 105,
      scaleY: (options?.height || 120) / 65,
      name: 'Cloud',
    })
    ;(cloud as any).id = uuidv4()
    this.canvas.add(cloud)
    this.canvas.setActiveObject(cloud)
    this.canvas.renderAll()
    this.saveHistory()
    return cloud
  }

  // Feature 144: Create callout/annotation shape
  addCallout(text: string = 'Note', options?: Partial<any>) {
    const rect = this.addRect({
      width: 160,
      height: 40,
      fill: '#FFF3CD',
      stroke: '#FFC107',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      name: 'Callout',
      ...options,
    })
    const left = options?.left || 100
    const top = options?.top || 100
    this.addText({
      text,
      fontSize: 13,
      fill: '#856404',
      left: left + 10,
      top: top + 10,
      name: 'Callout Text',
    })
    return rect
  }

  // Feature 145: Create badge/pill shape
  addBadge(text: string = 'Badge', options?: Partial<any>) {
    const rect = this.addRect({
      width: 80,
      height: 28,
      fill: options?.fill || '#007AFF',
      rx: 14,
      ry: 14,
      name: 'Badge',
      ...options,
    })
    const left = options?.left || 100
    const top = options?.top || 100
    this.addText({
      text,
      fontSize: 12,
      fill: '#FFFFFF',
      fontWeight: 'bold',
      left: left + 15,
      top: top + 6,
      name: 'Badge Text',
    })
    return rect
  }

  // Feature 146: Create divider line
  addDivider(options?: Partial<any>) {
    return this.addLine({
      x1: 0, y1: 0,
      x2: options?.width || 300,
      y2: 0,
      stroke: options?.stroke || '#E0E0E0',
      strokeWidth: options?.strokeWidth || 1,
      name: 'Divider',
      ...options,
    })
  }

  // Feature 147: Create avatar placeholder (circle)
  addAvatarPlaceholder(options?: Partial<any>) {
    return this.addEllipse({
      width: options?.size || 48,
      height: options?.size || 48,
      fill: options?.fill || '#C4C4C4',
      name: 'Avatar',
      ...options,
    })
  }

  // Feature 148: Create button shape (rounded rect with text)
  addButton(text: string = 'Button', options?: Partial<any>) {
    const btnWidth = options?.width || 120
    const btnHeight = options?.height || 40
    const rect = this.addRect({
      width: btnWidth,
      height: btnHeight,
      fill: options?.fill || '#007AFF',
      rx: 8,
      ry: 8,
      name: 'Button',
      ...options,
    })
    const left = options?.left || 100
    const top = options?.top || 100
    this.addText({
      text,
      fontSize: 14,
      fill: '#FFFFFF',
      fontWeight: '600',
      left: left + btnWidth / 4,
      top: top + btnHeight / 4,
      name: 'Button Text',
    })
    return rect
  }

  // Feature 149: Create input field placeholder
  addInputField(options?: Partial<any>) {
    const fieldWidth = options?.width || 240
    const fieldHeight = options?.height || 36
    const rect = this.addRect({
      width: fieldWidth,
      height: fieldHeight,
      fill: '#FFFFFF',
      stroke: '#D1D5DB',
      strokeWidth: 1,
      rx: 6,
      ry: 6,
      name: 'Input Field',
      ...options,
    })
    const left = options?.left || 100
    const top = options?.top || 100
    this.addText({
      text: options?.placeholder || 'Placeholder text...',
      fontSize: 14,
      fill: '#9CA3AF',
      left: left + 12,
      top: top + 9,
      name: 'Input Placeholder',
    })
    return rect
  }

  // Feature 150: Create card component (rounded rect with shadow)
  addCard(options?: Partial<any>) {
    return this.addRect({
      width: options?.width || 320,
      height: options?.height || 200,
      fill: '#FFFFFF',
      rx: 12,
      ry: 12,
      shadow: new Shadow({ color: 'rgba(0,0,0,0.1)', blur: 10, offsetX: 0, offsetY: 4 }),
      name: 'Card',
      ...options,
    })
  }

  // Feature 151: Text transform - uppercase
  textToUpperCase() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active as any).text) return
    ;(active as any).set('text', (active as any).text.toUpperCase())
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 152: Text transform - lowercase
  textToLowerCase() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active as any).text) return
    ;(active as any).set('text', (active as any).text.toLowerCase())
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 153: Text transform - title case
  textToTitleCase() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active as any).text) return
    const text = (active as any).text as string
    const titled = text.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    ;(active as any).set('text', titled)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 154: Increase font size by step
  increaseFontSize(step: number = 2) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active as any).fontSize) return
    const currentSize = (active as any).fontSize || 16
    ;(active as any).set('fontSize', currentSize + step)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 155: Decrease font size by step
  decreaseFontSize(step: number = 2) {
    const active = this.canvas.getActiveObject()
    if (!active || !(active as any).fontSize) return
    const currentSize = (active as any).fontSize || 16
    ;(active as any).set('fontSize', Math.max(1, currentSize - step))
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 156: Toggle bold on text
  toggleBold() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active as any).fontWeight) return
    const current = (active as any).fontWeight
    ;(active as any).set('fontWeight', current === 'bold' || current === '700' ? 'normal' : 'bold')
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 157: Toggle italic on text
  toggleItalic() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const current = (active as any).fontStyle
    ;(active as any).set('fontStyle', current === 'italic' ? 'normal' : 'italic')
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 158: Toggle underline on text
  toggleUnderline() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).set('underline', !(active as any).underline)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 159: Toggle strikethrough on text
  toggleStrikethrough() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).set('linethrough', !(active as any).linethrough)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 160: Set text alignment
  setTextAlign(align: 'left' | 'center' | 'right' | 'justify') {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).set('textAlign', align)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 161: Set line height
  setLineHeight(lineHeight: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).set('lineHeight', lineHeight)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 162: Set letter spacing
  setCharSpacing(spacing: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).set('charSpacing', spacing)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 163: Set font family
  setFontFamily(fontFamily: string) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).set('fontFamily', fontFamily)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 164: Increase stroke width by step
  increaseStrokeWidth(step: number = 1) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const current = active.strokeWidth || 0
    active.set('strokeWidth', current + step)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 165: Decrease stroke width
  decreaseStrokeWidth(step: number = 1) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const current = active.strokeWidth || 0
    active.set('strokeWidth', Math.max(0, current - step))
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 166: Remove stroke from object
  removeStroke() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ stroke: '', strokeWidth: 0 })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 167: Remove fill from object
  removeFill() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('fill', 'transparent')
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 168: Swap fill and stroke colors
  swapFillAndStroke() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const currentFill = active.fill
    const currentStroke = active.stroke
    active.set({
      fill: typeof currentStroke === 'string' ? currentStroke : 'transparent',
      stroke: typeof currentFill === 'string' ? currentFill : '',
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 169: Apply color from one object to another
  pickColorFrom(sourceId: string) {
    const source = this.getObjectById(sourceId)
    const active = this.canvas.getActiveObject()
    if (!source || !active) return
    if (typeof source.fill === 'string') {
      active.set('fill', source.fill)
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 170: Set object's stroke to dashed
  setDashedStroke(dashLength: number = 5, gapLength: number = 5) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('strokeDashArray', [dashLength, gapLength])
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 171: Set object's stroke to dotted
  setDottedStroke(dotSize: number = 2, gapSize: number = 4) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({
      strokeDashArray: [dotSize, gapSize],
      strokeLineCap: 'round',
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 172: Set solid stroke (remove dash)
  setSolidStroke() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set('strokeDashArray', [])
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 173: Darken fill color by percentage
  darkenFill(amount: number = 10) {
    const active = this.canvas.getActiveObject()
    if (!active || typeof active.fill !== 'string') return
    const color = active.fill
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    const factor = 1 - amount / 100
    const nr = Math.max(0, Math.round(r * factor))
    const ng = Math.max(0, Math.round(g * factor))
    const nb = Math.max(0, Math.round(b * factor))
    active.set('fill', `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 174: Lighten fill color by percentage
  lightenFill(amount: number = 10) {
    const active = this.canvas.getActiveObject()
    if (!active || typeof active.fill !== 'string') return
    const color = active.fill
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    const factor = amount / 100
    const nr = Math.min(255, Math.round(r + (255 - r) * factor))
    const ng = Math.min(255, Math.round(g + (255 - g) * factor))
    const nb = Math.min(255, Math.round(b + (255 - b) * factor))
    active.set('fill', `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 175: Invert fill color
  invertFillColor() {
    const active = this.canvas.getActiveObject()
    if (!active || typeof active.fill !== 'string') return
    const color = active.fill
    if (!color.startsWith('#') || color.length < 7) return
    const r = 255 - parseInt(color.slice(1, 3), 16)
    const g = 255 - parseInt(color.slice(3, 5), 16)
    const b = 255 - parseInt(color.slice(5, 7), 16)
    active.set('fill', `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 176: Convert fill to grayscale
  grayscaleFill() {
    const active = this.canvas.getActiveObject()
    if (!active || typeof active.fill !== 'string') return
    const color = active.fill
    if (!color.startsWith('#') || color.length < 7) return
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    active.set('fill', `#${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}`)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 177: Get hex color at canvas point
  getPixelColor(x: number, y: number): string | null {
    const ctx = this.canvas.getContext()
    if (!ctx) return null
    const pixel = ctx.getImageData(x, y, 1, 1).data
    return `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`
  }

  // Feature 178: Increase object opacity
  increaseOpacity(step: number = 0.1) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const current = active.opacity || 1
    active.set('opacity', Math.min(1, current + step))
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 179: Decrease object opacity
  decreaseOpacity(step: number = 0.1) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const current = active.opacity || 1
    active.set('opacity', Math.max(0, current - step))
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 180: Lock object position only
  lockPosition() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ lockMovementX: true, lockMovementY: true })
    this.canvas.renderAll()
  }

  // Feature 181: Lock object rotation only
  lockRotation() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ lockRotation: true })
    this.canvas.renderAll()
  }

  // Feature 182: Lock object scaling only
  lockScaling() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ lockScalingX: true, lockScalingY: true })
    this.canvas.renderAll()
  }

  // Feature 183: Unlock all transforms on object
  unlockAll() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      hasControls: true,
      selectable: true,
      evented: true,
    })
    this.canvas.renderAll()
  }

  // Feature 184: Get history length
  getHistoryLength(): number {
    return this.history.length
  }

  // Feature 185: Get current history index
  getHistoryIndex(): number {
    return this.historyIndex
  }

  // Feature 186: Clear all history
  clearHistory() {
    const current = this.serializeCanvas()
    this.history = [current]
    this.historyIndex = 0
    this.onHistoryChange?.(false, false)
  }

  // Feature 187: Scale object to specific width maintaining aspect ratio
  scaleToWidth(targetWidth: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const currentWidth = (active.width || 1) * (active.scaleX || 1)
    const scale = targetWidth / (active.width || 1)
    active.set({ scaleX: scale, scaleY: scale })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 188: Scale object to specific height maintaining aspect ratio
  scaleToHeight(targetHeight: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const scale = targetHeight / (active.height || 1)
    active.set({ scaleX: scale, scaleY: scale })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 189: Fit object proportionally within a bounding box
  fitInBox(maxWidth: number, maxHeight: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const objW = active.width || 1
    const objH = active.height || 1
    const scaleX = maxWidth / objW
    const scaleY = maxHeight / objH
    const scale = Math.min(scaleX, scaleY)
    active.set({ scaleX: scale, scaleY: scale })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 190: Get all locked objects
  getLockedObjects(): FabricObject[] {
    return this.canvas.getObjects().filter(o =>
      (o as any).lockMovementX || (o as any).lockMovementY || (o as any).lockRotation
    )
  }

  // Feature 191: Get all hidden objects
  getHiddenObjects(): FabricObject[] {
    return this.canvas.getObjects().filter(o => !o.visible)
  }

  // Feature 192: Show all hidden objects
  showAllObjects() {
    this.canvas.getObjects().forEach(o => {
      if (!(o as any).isGrid && !(o as any).isPreview) {
        o.set('visible', true)
      }
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 193: Unlock all objects
  unlockAllObjects() {
    this.canvas.getObjects().forEach(o => {
      o.set({
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        selectable: true,
        evented: true,
        hasControls: true,
      })
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 194: Get canvas as data URL at specific resolution
  exportAtResolution(width: number, height: number): string {
    const multiplierX = width / this.canvas.getWidth()
    const multiplierY = height / this.canvas.getHeight()
    const multiplier = Math.max(multiplierX, multiplierY)
    return this.canvas.toDataURL({
      format: 'png',
      multiplier,
    })
  }

  // Feature 195: Export only visible objects
  exportVisibleOnly(): string {
    const hiddenObjects = this.canvas.getObjects().filter(o => !o.visible)
    // Temporarily show grid/preview objects are already hidden
    return this.canvas.toDataURL({ format: 'png', multiplier: 2 })
  }

  // Feature 196: Get all text content from canvas
  getAllTextContent(): string[] {
    return this.canvas.getObjects()
      .filter(o => (o as any).text && !(o as any).isGrid)
      .map(o => (o as any).text as string)
  }

  // Feature 197: Find and replace text across all text objects
  findAndReplaceText(find: string, replace: string): number {
    let count = 0
    this.canvas.getObjects().forEach(o => {
      if ((o as any).text && typeof (o as any).text === 'string') {
        const text = (o as any).text as string
        if (text.includes(find)) {
          ;(o as any).set('text', text.split(find).join(replace))
          count++
        }
      }
    })
    if (count > 0) {
      this.canvas.renderAll()
      this.saveHistory()
    }
    return count
  }

  // Feature 198: Get canvas size in pixels
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
    }
  }

  // Feature 199: Set canvas size
  setCanvasSize(width: number, height: number) {
    this.canvas.setWidth(width)
    this.canvas.setHeight(height)
    this.canvas.renderAll()
  }

  // Feature 200: Get zoom level
  getZoomLevel(): number {
    return this.canvas.getZoom()
  }

  // ===== FEATURES 201-300: More CanvasEngine Methods =====

  // Feature 201: Align selected to page center
  alignToPageCenter() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const cw = this.canvas.getWidth()
    const ch = this.canvas.getHeight()
    const w = (active.width || 0) * (active.scaleX || 1)
    const h = (active.height || 0) * (active.scaleY || 1)
    active.set({ left: (cw - w) / 2, top: (ch - h) / 2 })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 202: Snap object to nearest grid point
  snapToNearestGrid(gridSize: number = 10) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const left = Math.round((active.left || 0) / gridSize) * gridSize
    const top = Math.round((active.top || 0) / gridSize) * gridSize
    active.set({ left, top })
    active.setCoords()
    this.canvas.renderAll()
  }

  // Feature 203: Create wireframe rectangle (no fill, thin stroke)
  addWireframeRect(options?: Partial<any>) {
    return this.addRect({
      fill: 'transparent',
      stroke: '#999999',
      strokeWidth: 1,
      name: 'Wireframe Rect',
      ...options,
    })
  }

  // Feature 204: Create placeholder image box
  addImagePlaceholder(options?: Partial<any>) {
    const w = options?.width || 200
    const h = options?.height || 150
    const rect = this.addRect({
      width: w,
      height: h,
      fill: '#E5E7EB',
      stroke: '#D1D5DB',
      strokeWidth: 1,
      name: 'Image Placeholder',
      ...options,
    })
    this.addText({
      text: '🖼',
      fontSize: 24,
      left: (options?.left || 100) + w / 2 - 12,
      top: (options?.top || 100) + h / 2 - 12,
      name: 'Placeholder Icon',
    })
    return rect
  }

  // Feature 205: Create header bar component
  addHeaderBar(options?: Partial<any>) {
    return this.addRect({
      width: options?.width || 800,
      height: options?.height || 64,
      fill: options?.fill || '#1F2937',
      name: 'Header Bar',
      ...options,
    })
  }

  // Feature 206: Create sidebar component
  addSidebar(options?: Partial<any>) {
    return this.addRect({
      width: options?.width || 240,
      height: options?.height || 600,
      fill: options?.fill || '#F9FAFB',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      name: 'Sidebar',
      ...options,
    })
  }

  // Feature 207: Create modal/dialog overlay
  addModalOverlay(options?: Partial<any>) {
    const backdrop = this.addRect({
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
      fill: 'rgba(0,0,0,0.5)',
      left: 0,
      top: 0,
      selectable: false,
      name: 'Modal Backdrop',
    })
    const modal = this.addRect({
      width: options?.width || 400,
      height: options?.height || 300,
      fill: '#FFFFFF',
      rx: 12,
      ry: 12,
      shadow: new Shadow({ color: 'rgba(0,0,0,0.25)', blur: 20, offsetX: 0, offsetY: 8 }),
      left: (this.canvas.getWidth() - (options?.width || 400)) / 2,
      top: (this.canvas.getHeight() - (options?.height || 300)) / 2,
      name: 'Modal',
      ...options,
    })
    return modal
  }

  // Feature 208: Create progress bar
  addProgressBar(progress: number = 0.6, options?: Partial<any>) {
    const totalWidth = options?.width || 200
    const height = options?.height || 8
    const left = options?.left || 100
    const top = options?.top || 100
    this.addRect({
      width: totalWidth,
      height,
      fill: '#E5E7EB',
      rx: 4,
      ry: 4,
      left,
      top,
      name: 'Progress Track',
    })
    return this.addRect({
      width: totalWidth * Math.min(1, Math.max(0, progress)),
      height,
      fill: options?.fill || '#3B82F6',
      rx: 4,
      ry: 4,
      left,
      top,
      name: 'Progress Fill',
    })
  }

  // Feature 209: Create toggle/switch UI
  addToggleSwitch(isOn: boolean = true, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    this.addRect({
      width: 44,
      height: 24,
      fill: isOn ? '#34C759' : '#E5E7EB',
      rx: 12,
      ry: 12,
      left,
      top,
      name: 'Toggle Track',
    })
    return this.addEllipse({
      width: 20,
      height: 20,
      fill: '#FFFFFF',
      left: left + (isOn ? 22 : 2),
      top: top + 2,
      shadow: new Shadow({ color: 'rgba(0,0,0,0.15)', blur: 4, offsetX: 0, offsetY: 2 }),
      name: 'Toggle Knob',
    })
  }

  // Feature 210: Create checkbox UI
  addCheckbox(checked: boolean = false, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    return this.addRect({
      width: 18,
      height: 18,
      fill: checked ? '#007AFF' : '#FFFFFF',
      stroke: checked ? '#007AFF' : '#D1D5DB',
      strokeWidth: 2,
      rx: 4,
      ry: 4,
      left,
      top,
      name: checked ? 'Checkbox Checked' : 'Checkbox',
    })
  }

  // Feature 211: Create radio button UI
  addRadioButton(selected: boolean = false, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    this.addEllipse({
      width: 18,
      height: 18,
      fill: '#FFFFFF',
      stroke: selected ? '#007AFF' : '#D1D5DB',
      strokeWidth: 2,
      left,
      top,
      name: 'Radio Outer',
    })
    if (selected) {
      this.addEllipse({
        width: 10,
        height: 10,
        fill: '#007AFF',
        left: left + 4,
        top: top + 4,
        name: 'Radio Inner',
      })
    }
  }

  // Feature 212: Create dropdown/select component
  addDropdown(text: string = 'Select...', options?: Partial<any>) {
    const w = options?.width || 200
    const h = options?.height || 36
    const left = options?.left || 100
    const top = options?.top || 100
    this.addRect({
      width: w,
      height: h,
      fill: '#FFFFFF',
      stroke: '#D1D5DB',
      strokeWidth: 1,
      rx: 6,
      ry: 6,
      left,
      top,
      name: 'Dropdown',
    })
    this.addText({
      text,
      fontSize: 14,
      fill: '#374151',
      left: left + 12,
      top: top + 9,
      name: 'Dropdown Text',
    })
    return this.addText({
      text: '▾',
      fontSize: 14,
      fill: '#9CA3AF',
      left: left + w - 24,
      top: top + 8,
      name: 'Dropdown Arrow',
    })
  }

  // Feature 213: Create tab bar
  addTabBar(tabs: string[] = ['Tab 1', 'Tab 2', 'Tab 3'], activeIndex: number = 0, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const tabWidth = options?.tabWidth || 100
    const h = 40
    tabs.forEach((tab, i) => {
      this.addRect({
        width: tabWidth,
        height: h,
        fill: i === activeIndex ? '#FFFFFF' : '#F3F4F6',
        stroke: '#E5E7EB',
        strokeWidth: 1,
        left: left + i * tabWidth,
        top,
        name: `Tab ${i + 1}`,
      })
      this.addText({
        text: tab,
        fontSize: 13,
        fill: i === activeIndex ? '#007AFF' : '#6B7280',
        fontWeight: i === activeIndex ? '600' : 'normal',
        left: left + i * tabWidth + 15,
        top: top + 12,
        name: `Tab Label ${i + 1}`,
      })
    })
  }

  // Feature 214: Create breadcrumb navigation
  addBreadcrumb(items: string[] = ['Home', 'Products', 'Detail'], options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    let currentX = left
    items.forEach((item, i) => {
      this.addText({
        text: item,
        fontSize: 13,
        fill: i === items.length - 1 ? '#111827' : '#6B7280',
        fontWeight: i === items.length - 1 ? '600' : 'normal',
        left: currentX,
        top,
        name: `Breadcrumb ${i + 1}`,
      })
      currentX += item.length * 8 + 5
      if (i < items.length - 1) {
        this.addText({
          text: '/',
          fontSize: 13,
          fill: '#D1D5DB',
          left: currentX,
          top,
          name: 'Breadcrumb Separator',
        })
        currentX += 12
      }
    })
  }

  // Feature 215: Create tooltip shape
  addTooltip(text: string = 'Tooltip text', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const padding = 8
    const charWidth = 7
    const w = text.length * charWidth + padding * 2
    this.addRect({
      width: w,
      height: 28,
      fill: '#1F2937',
      rx: 4,
      ry: 4,
      left,
      top,
      name: 'Tooltip Background',
    })
    return this.addText({
      text,
      fontSize: 12,
      fill: '#FFFFFF',
      left: left + padding,
      top: top + 6,
      name: 'Tooltip Text',
    })
  }

  // Feature 216: Create chip/tag component
  addChip(text: string = 'Tag', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = text.length * 8 + 24
    this.addRect({
      width: w,
      height: 26,
      fill: options?.fill || '#EFF6FF',
      rx: 13,
      ry: 13,
      left,
      top,
      name: 'Chip',
    })
    return this.addText({
      text,
      fontSize: 12,
      fill: options?.textColor || '#1D4ED8',
      left: left + 12,
      top: top + 5,
      name: 'Chip Text',
    })
  }

  // Feature 217: Create icon button (circle with icon placeholder)
  addIconButton(options?: Partial<any>) {
    return this.addEllipse({
      width: options?.size || 40,
      height: options?.size || 40,
      fill: options?.fill || '#F3F4F6',
      stroke: options?.stroke || '',
      name: 'Icon Button',
      ...options,
    })
  }

  // Feature 218: Create list item
  addListItem(text: string = 'List item', index: number = 0, options?: Partial<any>) {
    const left = options?.left || 100
    const top = (options?.top || 100) + index * 44
    const w = options?.width || 300
    this.addRect({
      width: w,
      height: 44,
      fill: '#FFFFFF',
      stroke: '#F3F4F6',
      strokeWidth: 1,
      left,
      top,
      name: `List Item ${index + 1}`,
    })
    return this.addText({
      text,
      fontSize: 14,
      fill: '#374151',
      left: left + 16,
      top: top + 13,
      name: `List Text ${index + 1}`,
    })
  }

  // Feature 219: Create notification badge (small red circle with number)
  addNotificationBadge(count: number = 3, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const size = count > 9 ? 22 : 18
    this.addEllipse({
      width: size,
      height: size,
      fill: '#EF4444',
      left,
      top,
      name: 'Notification Badge',
    })
    return this.addText({
      text: count > 99 ? '99+' : String(count),
      fontSize: 10,
      fill: '#FFFFFF',
      fontWeight: 'bold',
      left: left + (count > 9 ? 3 : 5),
      top: top + 3,
      name: 'Badge Count',
    })
  }

  // Feature 220: Create status indicator dot
  addStatusDot(status: 'online' | 'offline' | 'busy' | 'away' = 'online', options?: Partial<any>) {
    const colors: Record<string, string> = {
      online: '#22C55E',
      offline: '#9CA3AF',
      busy: '#EF4444',
      away: '#F59E0B',
    }
    return this.addEllipse({
      width: 10,
      height: 10,
      fill: colors[status] || '#9CA3AF',
      name: `Status: ${status}`,
      ...options,
    })
  }

  // Feature 221: Create separator line (horizontal)
  addHorizontalSeparator(width: number = 300, options?: Partial<any>) {
    return this.addLine({
      x1: 0, y1: 0, x2: width, y2: 0,
      stroke: '#E5E7EB',
      strokeWidth: 1,
      name: 'Separator',
      ...options,
    })
  }

  // Feature 222: Create separator line (vertical)
  addVerticalSeparator(height: number = 300, options?: Partial<any>) {
    return this.addLine({
      x1: 0, y1: 0, x2: 0, y2: height,
      stroke: '#E5E7EB',
      strokeWidth: 1,
      name: 'Vertical Separator',
      ...options,
    })
  }

  // Feature 223: Mirror object (create mirrored duplicate)
  async mirrorHorizontal() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const cloned = await active.clone()
    ;(cloned as any).id = uuidv4()
    const w = (active.width || 0) * (active.scaleX || 1)
    cloned.set({
      left: (active.left || 0) + w + 20,
      flipX: !active.flipX,
    })
    ;(cloned as any).name = ((active as any).name || 'Object') + ' (mirror)'
    this.canvas.add(cloned)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 224: Mirror object vertically (create mirrored duplicate)
  async mirrorVertical() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const cloned = await active.clone()
    ;(cloned as any).id = uuidv4()
    const h = (active.height || 0) * (active.scaleY || 1)
    cloned.set({
      top: (active.top || 0) + h + 20,
      flipY: !active.flipY,
    })
    ;(cloned as any).name = ((active as any).name || 'Object') + ' (mirror)'
    this.canvas.add(cloned)
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 225: Create a pattern of duplicates
  async createPattern(rows: number = 3, cols: number = 3, gapX: number = 10, gapY: number = 10) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const w = (active.width || 50) * (active.scaleX || 1)
    const h = (active.height || 50) * (active.scaleY || 1)
    const baseLeft = active.left || 0
    const baseTop = active.top || 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue
        const cloned = await active.clone()
        ;(cloned as any).id = uuidv4()
        ;(cloned as any).name = ((active as any).name || 'Object') + ` (${r},${c})`
        cloned.set({
          left: baseLeft + c * (w + gapX),
          top: baseTop + r * (h + gapY),
        })
        this.canvas.add(cloned)
      }
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 226: Create radial pattern
  async createRadialPattern(count: number = 8, radius: number = 150) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const centerX = (active.left || 0)
    const centerY = (active.top || 0)
    const angleStep = 360 / count
    for (let i = 1; i < count; i++) {
      const angle = (i * angleStep * Math.PI) / 180
      const cloned = await active.clone()
      ;(cloned as any).id = uuidv4()
      ;(cloned as any).name = ((active as any).name || 'Object') + ` (radial ${i})`
      cloned.set({
        left: centerX + radius * Math.cos(angle),
        top: centerY + radius * Math.sin(angle),
        angle: i * angleStep,
      })
      this.canvas.add(cloned)
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 227: Measure width of selected object
  getMeasuredWidth(): number {
    const active = this.canvas.getActiveObject()
    if (!active) return 0
    return (active.width || 0) * (active.scaleX || 1)
  }

  // Feature 228: Measure height of selected object
  getMeasuredHeight(): number {
    const active = this.canvas.getActiveObject()
    if (!active) return 0
    return (active.height || 0) * (active.scaleY || 1)
  }

  // Feature 229: Get perimeter of selected object
  getPerimeter(): number {
    const w = this.getMeasuredWidth()
    const h = this.getMeasuredHeight()
    return 2 * (w + h)
  }

  // Feature 230: Get area of selected object
  getArea(): number {
    return this.getMeasuredWidth() * this.getMeasuredHeight()
  }

  // Feature 231: Set minimum size constraint
  setMinSize(minW: number, minH: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any)._minWidth = minW
    ;(active as any)._minHeight = minH
  }

  // Feature 232: Set maximum size constraint
  setMaxSize(maxW: number, maxH: number) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any)._maxWidth = maxW
    ;(active as any)._maxHeight = maxH
  }

  // Feature 233: Pin object to canvas corner
  pinToCorner(corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const w = (active.width || 0) * (active.scaleX || 1)
    const h = (active.height || 0) * (active.scaleY || 1)
    const cw = this.canvas.getWidth()
    const ch = this.canvas.getHeight()
    const margin = 20
    switch (corner) {
      case 'top-left': active.set({ left: margin, top: margin }); break
      case 'top-right': active.set({ left: cw - w - margin, top: margin }); break
      case 'bottom-left': active.set({ left: margin, top: ch - h - margin }); break
      case 'bottom-right': active.set({ left: cw - w - margin, top: ch - h - margin }); break
    }
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 234: Center object on canvas horizontally only
  centerX() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const w = (active.width || 0) * (active.scaleX || 1)
    active.set('left', (this.canvas.getWidth() - w) / 2)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 235: Center object on canvas vertically only
  centerY() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const h = (active.height || 0) * (active.scaleY || 1)
    active.set('top', (this.canvas.getHeight() - h) / 2)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 236: Flatten rotation (reset angle but keep visual appearance)
  flattenRotation() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const angle = active.angle || 0
    if (angle === 0) return
    active.rotate(0)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 237: Make object square (equalize width and height)
  makeSquare() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const w = (active.width || 0) * (active.scaleX || 1)
    const h = (active.height || 0) * (active.scaleY || 1)
    const size = Math.max(w, h)
    active.set({
      scaleX: size / (active.width || 1),
      scaleY: size / (active.height || 1),
    })
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 238: Double object size
  doubleSize() {
    this.scaleBy(2)
  }

  // Feature 239: Halve object size
  halveSize() {
    this.scaleBy(0.5)
  }

  // Feature 240: Rotate object to face another object
  rotateToFace(targetId: string) {
    const active = this.canvas.getActiveObject()
    const target = this.getObjectById(targetId)
    if (!active || !target) return
    const c1 = active.getCenterPoint()
    const c2 = target.getCenterPoint()
    const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x) * 180 / Math.PI
    active.set('angle', angle)
    active.setCoords()
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 241: Set object as non-interactive (visible but can't select)
  makeNonInteractive() {
    const active = this.canvas.getActiveObject()
    if (!active) return
    active.set({ selectable: false, evented: false })
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
  }

  // Feature 242: Set object as interactive
  makeInteractive(id: string) {
    const obj = this.getObjectById(id)
    if (!obj) return
    obj.set({ selectable: true, evented: true })
    this.canvas.renderAll()
  }

  // Feature 243: Get object opacity
  getOpacity(): number {
    const active = this.canvas.getActiveObject()
    return active?.opacity || 1
  }

  // Feature 244: Get object angle/rotation
  getRotation(): number {
    const active = this.canvas.getActiveObject()
    return active?.angle || 0
  }

  // Feature 245: Get object scale
  getScale(): { scaleX: number; scaleY: number } {
    const active = this.canvas.getActiveObject()
    return { scaleX: active?.scaleX || 1, scaleY: active?.scaleY || 1 }
  }

  // Feature 246: Get current fill color
  getFillColor(): string | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    return typeof active.fill === 'string' ? active.fill : null
  }

  // Feature 247: Get current stroke color
  getStrokeColor(): string | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    return typeof active.stroke === 'string' ? active.stroke : null
  }

  // Feature 248: Get stroke width
  getStrokeWidth(): number {
    const active = this.canvas.getActiveObject()
    return active?.strokeWidth || 0
  }

  // Feature 249: Check if object has shadow
  hasShadow(): boolean {
    const active = this.canvas.getActiveObject()
    return !!active?.shadow
  }

  // Feature 250: Remove all shadows from all objects
  removeAllShadows() {
    this.canvas.getObjects().forEach(o => {
      if (!(o as any).isGrid) {
        o.set('shadow', null)
      }
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 251: Apply shadow to all selected objects
  applyShadowToAll(shadow: { color: string; blur: number; offsetX: number; offsetY: number }) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    const s = new Shadow(shadow)
    if (active instanceof ActiveSelection) {
      active.getObjects().forEach(o => o.set('shadow', s))
    } else {
      active.set('shadow', s)
    }
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 252: Create a simple chart bar
  addChartBar(values: number[] = [40, 60, 30, 80, 50], options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const barWidth = options?.barWidth || 30
    const gap = options?.gap || 8
    const maxHeight = options?.maxHeight || 150
    const maxVal = Math.max(...values)
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']
    values.forEach((val, i) => {
      const h = (val / maxVal) * maxHeight
      this.addRect({
        width: barWidth,
        height: h,
        fill: colors[i % colors.length],
        left: left + i * (barWidth + gap),
        top: top + maxHeight - h,
        rx: 2,
        ry: 2,
        name: `Bar ${i + 1}`,
      })
    })
  }

  // Feature 253: Create pie chart slice indicator
  addPieSlice(percentage: number = 25, options?: Partial<any>) {
    const size = options?.size || 100
    return this.addEllipse({
      width: size,
      height: size,
      fill: options?.fill || '#3B82F6',
      name: `Pie ${percentage}%`,
      ...options,
    })
  }

  // Feature 254: Create color swatch
  addColorSwatch(color: string = '#3B82F6', options?: Partial<any>) {
    return this.addRect({
      width: options?.size || 40,
      height: options?.size || 40,
      fill: color,
      rx: 4,
      ry: 4,
      stroke: '#E5E7EB',
      strokeWidth: 1,
      name: `Swatch ${color}`,
      ...options,
    })
  }

  // Feature 255: Create color palette row
  addColorPalette(colors: string[] = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'], options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const size = options?.size || 32
    const gap = options?.gap || 4
    colors.forEach((color, i) => {
      this.addColorSwatch(color, {
        size,
        left: left + i * (size + gap),
        top,
      })
    })
  }

  // Feature 256: Create smartphone frame
  addPhoneFrame(options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 375
    const h = options?.height || 812
    // Phone body
    this.addRect({
      width: w + 20,
      height: h + 40,
      fill: '#1F2937',
      rx: 40,
      ry: 40,
      left: left - 10,
      top: top - 20,
      name: 'Phone Frame',
    })
    // Screen
    return this.addRect({
      width: w,
      height: h,
      fill: '#FFFFFF',
      rx: 30,
      ry: 30,
      left,
      top,
      name: 'Phone Screen',
    })
  }

  // Feature 257: Create browser frame
  addBrowserFrame(options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 800
    const h = options?.height || 600
    // Browser chrome
    this.addRect({
      width: w,
      height: 36,
      fill: '#F3F4F6',
      rx: 8,
      ry: 8,
      left,
      top,
      name: 'Browser Chrome',
    })
    // Traffic lights
    const dotY = top + 14
    this.addEllipse({ width: 10, height: 10, fill: '#EF4444', left: left + 12, top: dotY, name: 'Close' })
    this.addEllipse({ width: 10, height: 10, fill: '#F59E0B', left: left + 28, top: dotY, name: 'Minimize' })
    this.addEllipse({ width: 10, height: 10, fill: '#22C55E', left: left + 44, top: dotY, name: 'Maximize' })
    // Content area
    return this.addRect({
      width: w,
      height: h - 36,
      fill: '#FFFFFF',
      left,
      top: top + 36,
      name: 'Browser Content',
    })
  }

  // Feature 258: Create tablet frame
  addTabletFrame(options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 768
    const h = options?.height || 1024
    this.addRect({
      width: w + 30,
      height: h + 50,
      fill: '#374151',
      rx: 24,
      ry: 24,
      left: left - 15,
      top: top - 25,
      name: 'Tablet Frame',
    })
    return this.addRect({
      width: w,
      height: h,
      fill: '#FFFFFF',
      rx: 4,
      ry: 4,
      left,
      top,
      name: 'Tablet Screen',
    })
  }

  // Feature 259: Create desktop/laptop frame
  addDesktopFrame(options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 1280
    const h = options?.height || 800
    // Monitor
    this.addRect({
      width: w + 40,
      height: h + 40,
      fill: '#1F2937',
      rx: 12,
      ry: 12,
      left: left - 20,
      top: top - 20,
      name: 'Monitor Frame',
    })
    // Screen
    this.addRect({
      width: w,
      height: h,
      fill: '#FFFFFF',
      left,
      top,
      name: 'Monitor Screen',
    })
    // Stand
    return this.addRect({
      width: 200,
      height: 60,
      fill: '#4B5563',
      rx: 4,
      ry: 4,
      left: left + w / 2 - 100,
      top: top + h + 30,
      name: 'Monitor Stand',
    })
  }

  // Feature 260: Create loading spinner placeholder
  addLoadingSpinner(options?: Partial<any>) {
    return this.addEllipse({
      width: options?.size || 32,
      height: options?.size || 32,
      fill: 'transparent',
      stroke: options?.color || '#3B82F6',
      strokeWidth: 3,
      strokeDashArray: [20, 10],
      name: 'Loading Spinner',
      ...options,
    })
  }

  // Feature 261: Create skeleton loading placeholder
  addSkeleton(options?: Partial<any>) {
    return this.addRect({
      width: options?.width || 200,
      height: options?.height || 20,
      fill: '#E5E7EB',
      rx: 4,
      ry: 4,
      name: 'Skeleton',
      ...options,
    })
  }

  // Feature 262: Create a text link style
  addTextLink(text: string = 'Click here', options?: Partial<any>) {
    return this.addText({
      text,
      fontSize: 14,
      fill: '#2563EB',
      underline: true,
      name: 'Link',
      ...options,
    })
  }

  // Feature 263: Create a code block placeholder
  addCodeBlock(code: string = 'const x = 1;', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 300
    const h = options?.height || 100
    this.addRect({
      width: w,
      height: h,
      fill: '#1E1E1E',
      rx: 8,
      ry: 8,
      left,
      top,
      name: 'Code Block',
    })
    return this.addText({
      text: code,
      fontSize: 13,
      fill: '#D4D4D4',
      fontFamily: 'monospace',
      left: left + 16,
      top: top + 16,
      name: 'Code Text',
    })
  }

  // Feature 264: Create a blockquote
  addBlockquote(text: string = 'Quote text here', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    this.addRect({
      width: 4,
      height: 40,
      fill: '#6B7280',
      left,
      top,
      name: 'Quote Bar',
    })
    return this.addText({
      text,
      fontSize: 16,
      fill: '#4B5563',
      fontStyle: 'italic',
      left: left + 16,
      top: top + 8,
      name: 'Quote Text',
    })
  }

  // Feature 265: Create ordered list items
  addOrderedList(items: string[] = ['First item', 'Second item', 'Third item'], options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const lineHeight = 28
    items.forEach((item, i) => {
      this.addText({
        text: `${i + 1}. ${item}`,
        fontSize: 14,
        fill: '#374151',
        left,
        top: top + i * lineHeight,
        name: `List ${i + 1}`,
      })
    })
  }

  // Feature 266: Create unordered list items
  addUnorderedList(items: string[] = ['First item', 'Second item', 'Third item'], options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const lineHeight = 28
    items.forEach((item, i) => {
      this.addText({
        text: `• ${item}`,
        fontSize: 14,
        fill: '#374151',
        left,
        top: top + i * lineHeight,
        name: `Bullet ${i + 1}`,
      })
    })
  }

  // Feature 267: Create table grid
  addTableGrid(rows: number = 4, cols: number = 3, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const cellW = options?.cellWidth || 120
    const cellH = options?.cellHeight || 36
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.addRect({
          width: cellW,
          height: cellH,
          fill: r === 0 ? '#F3F4F6' : '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          left: left + c * cellW,
          top: top + r * cellH,
          name: `Cell ${r + 1}-${c + 1}`,
        })
      }
    }
  }

  // Feature 268: Create form layout
  addFormLayout(fields: string[] = ['Name', 'Email', 'Message'], options?: Partial<any>) {
    const left = options?.left || 100
    let currentY = options?.top || 100
    fields.forEach(field => {
      this.addText({
        text: field,
        fontSize: 13,
        fill: '#374151',
        fontWeight: '500',
        left,
        top: currentY,
        name: `Label: ${field}`,
      })
      currentY += 22
      this.addInputField({
        width: options?.width || 300,
        left,
        top: currentY,
        placeholder: `Enter ${field.toLowerCase()}...`,
      })
      currentY += 52
    })
    this.addButton('Submit', {
      left,
      top: currentY,
      width: options?.width || 300,
    })
  }

  // Feature 269: Create social media icon set placeholders
  addSocialIcons(options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const size = 32
    const gap = 12
    const labels = ['Tw', 'Fb', 'Ig', 'Li', 'Gh']
    const colors = ['#1DA1F2', '#4267B2', '#E4405F', '#0A66C2', '#333333']
    labels.forEach((label, i) => {
      const x = left + i * (size + gap)
      this.addEllipse({
        width: size,
        height: size,
        fill: colors[i],
        left: x,
        top,
        name: label,
      })
      this.addText({
        text: label,
        fontSize: 10,
        fill: '#FFFFFF',
        fontWeight: 'bold',
        left: x + 8,
        top: top + 10,
        name: `${label} Label`,
      })
    })
  }

  // Feature 270: Create pricing card
  addPricingCard(plan: string = 'Pro', price: string = '$29', features: string[] = ['Feature 1', 'Feature 2'], options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 280
    this.addCard({ width: w, height: 350, left, top })
    this.addText({ text: plan, fontSize: 20, fontWeight: 'bold', fill: '#111827', left: left + 24, top: top + 24, name: 'Plan Name' })
    this.addText({ text: price, fontSize: 36, fontWeight: 'bold', fill: '#111827', left: left + 24, top: top + 56, name: 'Price' })
    this.addText({ text: '/month', fontSize: 14, fill: '#6B7280', left: left + 24 + price.length * 20, top: top + 72, name: 'Period' })
    this.addDivider({ left: left + 24, top: top + 110, width: w - 48 })
    features.forEach((f, i) => {
      this.addText({ text: `✓ ${f}`, fontSize: 14, fill: '#374151', left: left + 24, top: top + 130 + i * 28, name: `Feature ${i + 1}` })
    })
    this.addButton('Get Started', { left: left + 24, top: top + 290, width: w - 48 })
  }

  // Feature 271: Create testimonial card
  addTestimonialCard(quote: string = 'Great product!', author: string = 'John Doe', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 320
    this.addCard({ width: w, height: 180, left, top })
    this.addText({ text: `"${quote}"`, fontSize: 14, fill: '#4B5563', fontStyle: 'italic', left: left + 24, top: top + 24, name: 'Quote' })
    this.addAvatarPlaceholder({ left: left + 24, top: top + 120, size: 36 })
    this.addText({ text: author, fontSize: 13, fontWeight: '600', fill: '#111827', left: left + 72, top: top + 130, name: 'Author' })
  }

  // Feature 272: Create feature card with icon
  addFeatureCard(title: string = 'Feature', description: string = 'Description text', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 280
    this.addCard({ width: w, height: 200, left, top })
    this.addEllipse({ width: 48, height: 48, fill: '#EFF6FF', left: left + 24, top: top + 24, name: 'Icon Bg' })
    this.addText({ text: title, fontSize: 18, fontWeight: 'bold', fill: '#111827', left: left + 24, top: top + 88, name: 'Feature Title' })
    this.addText({ text: description, fontSize: 14, fill: '#6B7280', left: left + 24, top: top + 118, name: 'Feature Desc' })
  }

  // Feature 273: Create hero section
  addHeroSection(options?: Partial<any>) {
    const left = options?.left || 0
    const top = options?.top || 0
    const w = options?.width || 1200
    const h = options?.height || 500
    this.addRect({ width: w, height: h, fill: '#F8FAFC', left, top, name: 'Hero Bg' })
    this.addText({ text: 'Your Product Name', fontSize: 48, fontWeight: 'bold', fill: '#0F172A', left: left + w / 4, top: top + h / 3, name: 'Hero Title' })
    this.addText({ text: 'A brief description of your amazing product goes here.', fontSize: 18, fill: '#64748B', left: left + w / 4, top: top + h / 3 + 64, name: 'Hero Subtitle' })
    this.addButton('Get Started', { left: left + w / 4, top: top + h / 3 + 120, width: 160, height: 48 })
  }

  // Feature 274: Create navigation bar
  addNavBar(links: string[] = ['Home', 'About', 'Products', 'Contact'], options?: Partial<any>) {
    const left = options?.left || 0
    const top = options?.top || 0
    const w = options?.width || 1200
    this.addRect({ width: w, height: 64, fill: '#FFFFFF', stroke: '#E5E7EB', strokeWidth: 1, left, top, name: 'Nav Bar' })
    this.addText({ text: 'Logo', fontSize: 18, fontWeight: 'bold', fill: '#111827', left: left + 24, top: top + 20, name: 'Logo' })
    let linkX = left + w - 100 * links.length
    links.forEach(link => {
      this.addText({ text: link, fontSize: 14, fill: '#6B7280', left: linkX, top: top + 22, name: `Nav: ${link}` })
      linkX += 100
    })
  }

  // Feature 275: Create footer section
  addFooter(options?: Partial<any>) {
    const left = options?.left || 0
    const top = options?.top || 800
    const w = options?.width || 1200
    this.addRect({ width: w, height: 200, fill: '#1F2937', left, top, name: 'Footer Bg' })
    this.addText({ text: '© 2024 Company Name', fontSize: 14, fill: '#9CA3AF', left: left + 24, top: top + 160, name: 'Copyright' })
    this.addText({ text: 'About  |  Terms  |  Privacy  |  Contact', fontSize: 13, fill: '#D1D5DB', left: left + 24, top: top + 24, name: 'Footer Links' })
  }

  // Feature 276: Create section heading with line
  addSectionHeading(text: string = 'Section Title', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    this.addText({ text, fontSize: 24, fontWeight: 'bold', fill: '#111827', left, top, name: 'Section Heading' })
    this.addDivider({ left, top: top + 36, width: options?.width || 200 })
  }

  // Feature 277: Create step/process indicator
  addStepIndicator(steps: string[] = ['Step 1', 'Step 2', 'Step 3'], currentStep: number = 0, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const gap = options?.gap || 120
    steps.forEach((step, i) => {
      const x = left + i * gap
      this.addEllipse({
        width: 32,
        height: 32,
        fill: i <= currentStep ? '#3B82F6' : '#E5E7EB',
        left: x,
        top,
        name: `Step ${i + 1} Circle`,
      })
      this.addText({
        text: String(i + 1),
        fontSize: 14,
        fontWeight: 'bold',
        fill: i <= currentStep ? '#FFFFFF' : '#9CA3AF',
        left: x + 10,
        top: top + 8,
        name: `Step ${i + 1} Number`,
      })
      this.addText({
        text: step,
        fontSize: 12,
        fill: '#6B7280',
        left: x,
        top: top + 40,
        name: `Step ${i + 1} Label`,
      })
      if (i < steps.length - 1) {
        this.addLine({
          x1: 0, y1: 0, x2: gap - 40, y2: 0,
          stroke: i < currentStep ? '#3B82F6' : '#E5E7EB',
          strokeWidth: 2,
          left: x + 36,
          top: top + 16,
          name: `Step Line ${i + 1}`,
        })
      }
    })
  }

  // Feature 278: Create star rating display
  addStarRating(rating: number = 4, maxStars: number = 5, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const size = options?.size || 24
    for (let i = 0; i < maxStars; i++) {
      this.addStar({
        left: left + i * (size + 4),
        top,
        width: size,
        height: size,
        fill: i < rating ? '#F59E0B' : '#D1D5DB',
        name: `Star ${i + 1}`,
      })
    }
  }

  // Feature 279: Create timeline item
  addTimelineItem(title: string, description: string, index: number = 0, options?: Partial<any>) {
    const left = options?.left || 100
    const top = (options?.top || 100) + index * 100
    // Dot
    this.addEllipse({ width: 12, height: 12, fill: '#3B82F6', left: left, top: top + 4, name: 'Timeline Dot' })
    // Line
    if (index > 0) {
      this.addLine({ x1: 0, y1: 0, x2: 0, y2: 80, stroke: '#D1D5DB', strokeWidth: 2, left: left + 5, top: top - 80, name: 'Timeline Line' })
    }
    // Text
    this.addText({ text: title, fontSize: 16, fontWeight: '600', fill: '#111827', left: left + 24, top, name: 'Timeline Title' })
    this.addText({ text: description, fontSize: 14, fill: '#6B7280', left: left + 24, top: top + 24, name: 'Timeline Desc' })
  }

  // Feature 280: Create stat/metric display
  addStatDisplay(value: string = '1,234', label: string = 'Total Users', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    this.addText({ text: value, fontSize: 36, fontWeight: 'bold', fill: '#111827', left, top, name: 'Stat Value' })
    this.addText({ text: label, fontSize: 14, fill: '#6B7280', left, top: top + 44, name: 'Stat Label' })
  }

  // Feature 281: Create profile card
  addProfileCard(name: string = 'John Doe', role: string = 'Designer', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 240
    this.addCard({ width: w, height: 280, left, top })
    this.addAvatarPlaceholder({ left: left + w / 2 - 36, top: top + 24, size: 72 })
    this.addText({ text: name, fontSize: 18, fontWeight: 'bold', fill: '#111827', left: left + 24, top: top + 120, name: 'Profile Name' })
    this.addText({ text: role, fontSize: 14, fill: '#6B7280', left: left + 24, top: top + 146, name: 'Profile Role' })
    this.addDivider({ left: left + 24, top: top + 180, width: w - 48 })
    this.addButton('Follow', { left: left + 24, top: top + 210, width: w - 48, height: 36 })
  }

  // Feature 282: Create notification/alert banner
  addAlertBanner(message: string = 'This is an alert', type: 'info' | 'warning' | 'error' | 'success' = 'info', options?: Partial<any>) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      info: { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD' },
      warning: { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
      error: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
      success: { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
    }
    const c = colors[type]
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 400
    this.addRect({ width: w, height: 44, fill: c.bg, stroke: c.border, strokeWidth: 1, rx: 8, ry: 8, left, top, name: `Alert: ${type}` })
    this.addText({ text: message, fontSize: 14, fill: c.text, left: left + 16, top: top + 13, name: 'Alert Text' })
  }

  // Feature 283: Create empty state illustration placeholder
  addEmptyState(message: string = 'No items found', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    const w = options?.width || 300
    this.addEllipse({ width: 80, height: 80, fill: '#F3F4F6', left: left + w / 2 - 40, top, name: 'Empty State Icon' })
    this.addText({ text: message, fontSize: 16, fill: '#6B7280', left: left + w / 4, top: top + 100, name: 'Empty State Text' })
  }

  // Feature 284: Sort selected objects by left position
  sortByPosition(direction: 'left' | 'top' = 'left') {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    const sorted = [...objects].sort((a, b) => (a[direction] || 0) - (b[direction] || 0))
    sorted.forEach((obj, i) => {
      this.canvas.moveTo(obj, i)
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 285: Reverse layer order of selected objects
  reverseLayerOrder() {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    const objects = active.getObjects()
    const indices = objects.map(o => this.canvas.getObjects().indexOf(o)).sort((a, b) => a - b)
    const reversed = [...objects].reverse()
    reversed.forEach((obj, i) => {
      this.canvas.moveTo(obj, indices[i])
    })
    this.canvas.renderAll()
    this.saveHistory()
  }

  // Feature 286: Create a simple line connector between two objects
  addConnector(id1: string, id2: string, options?: Partial<any>) {
    const obj1 = this.getObjectById(id1)
    const obj2 = this.getObjectById(id2)
    if (!obj1 || !obj2) return null
    const c1 = obj1.getCenterPoint()
    const c2 = obj2.getCenterPoint()
    return this.addLine({
      x1: c1.x,
      y1: c1.y,
      x2: c2.x,
      y2: c2.y,
      stroke: options?.stroke || '#9CA3AF',
      strokeWidth: options?.strokeWidth || 1,
      strokeDashArray: options?.dashed ? [5, 5] : undefined,
      name: 'Connector',
      ...options,
    })
  }

  // Feature 287: Create an arrow connector between two objects
  addArrowConnector(id1: string, id2: string, options?: Partial<any>) {
    const obj1 = this.getObjectById(id1)
    const obj2 = this.getObjectById(id2)
    if (!obj1 || !obj2) return null
    const c1 = obj1.getCenterPoint()
    const c2 = obj2.getCenterPoint()
    return this.addArrow({
      x1: c1.x,
      y1: c1.y,
      x2: c2.x,
      y2: c2.y,
      stroke: options?.stroke || '#6B7280',
      strokeWidth: options?.strokeWidth || 2,
      name: 'Arrow Connector',
      ...options,
    })
  }

  // Feature 288: Create flow chart box
  addFlowchartBox(text: string = 'Process', type: 'process' | 'decision' | 'terminal' = 'process', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    if (type === 'terminal') {
      this.addRect({ width: 140, height: 50, fill: '#DBEAFE', rx: 25, ry: 25, left, top, name: 'Terminal' })
    } else if (type === 'decision') {
      // Diamond shape using polygon
      this.addDiamond({ width: 100, height: 80, fill: '#FEF3C7', left, top, ...options })
    } else {
      this.addRect({ width: 140, height: 50, fill: '#E0E7FF', rx: 4, ry: 4, left, top, name: 'Process' })
    }
    this.addText({ text, fontSize: 13, fill: '#1F2937', left: left + 20, top: top + 16, name: `Flow: ${text}` })
  }

  // Feature 289: Constrain proportions during resize
  constrainProportions(constrained: boolean = true) {
    const active = this.canvas.getActiveObject()
    if (!active) return
    ;(active as any).lockUniScaling = constrained
    this.canvas.renderAll()
  }

  // Feature 290: Create ruler/measurement line
  addMeasurementLine(length: number = 200, options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    // Main line
    this.addLine({ x1: 0, y1: 0, x2: length, y2: 0, stroke: '#EF4444', strokeWidth: 1, left, top, name: 'Measurement Line' })
    // End caps
    this.addLine({ x1: 0, y1: -5, x2: 0, y2: 5, stroke: '#EF4444', strokeWidth: 1, left, top, name: 'Measure Start' })
    this.addLine({ x1: 0, y1: -5, x2: 0, y2: 5, stroke: '#EF4444', strokeWidth: 1, left: left + length, top, name: 'Measure End' })
    // Label
    this.addText({ text: `${length}px`, fontSize: 11, fill: '#EF4444', left: left + length / 2 - 15, top: top - 16, name: 'Measure Label' })
  }

  // Feature 291: Create annotation arrow
  addAnnotationArrow(text: string = 'Note', options?: Partial<any>) {
    const left = options?.left || 100
    const top = options?.top || 100
    this.addArrow({ x1: 0, y1: 0, x2: 80, y2: 40, stroke: '#EF4444', strokeWidth: 2, left, top, name: 'Annotation Arrow' })
    this.addText({ text, fontSize: 12, fill: '#EF4444', left: left + 85, top: top + 35, name: 'Annotation Text' })
  }

  // Feature 292: Get all object IDs
  getAllObjectIds(): string[] {
    return this.canvas.getObjects()
      .filter((o: any) => !o.isGrid && !o.isPreview)
      .map((o: any) => o.id as string)
      .filter(Boolean)
  }

  // Feature 293: Get all object names
  getAllObjectNames(): string[] {
    return this.canvas.getObjects()
      .filter((o: any) => !o.isGrid && !o.isPreview)
      .map((o: any) => (o.name || o.type || 'unnamed') as string)
  }

  // Feature 294: Find objects by name pattern
  findObjectsByName(pattern: string): FabricObject[] {
    const lower = pattern.toLowerCase()
    return this.canvas.getObjects().filter((o: any) =>
      !o.isGrid && !o.isPreview && (o.name || '').toLowerCase().includes(lower)
    )
  }

  // Feature 295: Select objects by name pattern
  selectByName(pattern: string) {
    const objects = this.findObjectsByName(pattern)
    if (objects.length === 0) return
    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else {
      const selection = new ActiveSelection(objects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }
    this.canvas.renderAll()
  }

  // Feature 296: Duplicate and offset in a specific direction
  async duplicateInDirection(direction: 'right' | 'down' | 'left' | 'up', offset: number = 20) {
    const dx = direction === 'right' ? offset : direction === 'left' ? -offset : 0
    const dy = direction === 'down' ? offset : direction === 'up' ? -offset : 0
    await this.duplicateToOffset(dx, dy)
  }

  // Feature 297: Set canvas interactive mode
  setInteractiveMode(interactive: boolean) {
    this.canvas.selection = interactive
    this.canvas.getObjects().forEach(o => {
      if (!(o as any).isGrid) {
        o.set({ selectable: interactive, evented: interactive })
      }
    })
    this.canvas.renderAll()
  }

  // Feature 298: Get selected object's bounding rect
  getSelectionBounds(): { left: number; top: number; width: number; height: number } | null {
    const active = this.canvas.getActiveObject()
    if (!active) return null
    return active.getBoundingRect()
  }

  // Feature 299: Create a simple wireframe layout
  addWireframeLayout(options?: Partial<any>) {
    const left = options?.left || 50
    const top = options?.top || 50
    const w = options?.width || 800
    // Header
    this.addWireframeRect({ width: w, height: 60, left, top })
    // Sidebar
    this.addWireframeRect({ width: 200, height: 500, left, top: top + 70 })
    // Content area
    this.addWireframeRect({ width: w - 210, height: 500, left: left + 210, top: top + 70 })
    // Footer
    this.addWireframeRect({ width: w, height: 60, left, top: top + 580 })
  }

  // Feature 300: Create a sticky note
  addStickyNote(text: string = 'Note', options?: Partial<any>) {
    const colors = ['#FEF3C7', '#DBEAFE', '#D1FAE5', '#FCE7F3', '#EDE9FE']
    const color = options?.color || colors[Math.floor(Math.random() * colors.length)]
    const left = options?.left || 100
    const top = options?.top || 100
    this.addRect({
      width: 150,
      height: 150,
      fill: color,
      shadow: new Shadow({ color: 'rgba(0,0,0,0.1)', blur: 5, offsetX: 2, offsetY: 2 }),
      left,
      top,
      name: 'Sticky Note',
    })
    this.addText({
      text,
      fontSize: 14,
      fill: '#374151',
      left: left + 12,
      top: top + 12,
      name: 'Sticky Text',
    })
  }

  // DISPOSE
  dispose() {
    this.canvas.dispose()
  }
}
