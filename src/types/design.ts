export type ToolType =
  | 'select'
  | 'hand'
  | 'frame'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'polygon'
  | 'star'
  | 'text'
  | 'pen'
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'image'
  | 'eyedropper'
  | 'comment'

export type GradientType = 'linear' | 'radial'

export interface GradientStop {
  offset: number
  color: string
}

export interface GradientConfig {
  type: GradientType
  angle: number
  stops: GradientStop[]
}

export type FillType = 'solid' | 'gradient' | 'none'

export interface FillConfig {
  type: FillType
  color: string
  opacity: number
  gradient?: GradientConfig
}

export interface StrokeConfig {
  color: string
  width: number
  opacity: number
  dashArray: number[]
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'miter' | 'round' | 'bevel'
}

export interface ShadowConfig {
  color: string
  blur: number
  offsetX: number
  offsetY: number
  enabled: boolean
}

export interface BlurConfig {
  enabled: boolean
  value: number
}

export interface LayerItem {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
  children?: LayerItem[]
  expanded?: boolean
}

export interface PageData {
  id: string
  name: string
  canvasJSON: string
  thumbnail?: string
}

export interface HistoryEntry {
  canvasJSON: string
  timestamp: number
  description: string
}

export interface GuideLineData {
  id: string
  orientation: 'horizontal' | 'vertical'
  position: number
}

export interface ExportSettings {
  format: 'png' | 'svg' | 'jpg' | 'pdf'
  scale: number
  quality: number
  background: boolean
  selectedOnly: boolean
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string
  fontStyle: string
  underline: boolean
  linethrough: boolean
  overline: boolean
  textAlign: string
  lineHeight: number
  charSpacing: number
  fill: string
}

export interface BrushSettings {
  type: 'pencil' | 'circle' | 'spray' | 'pattern'
  width: number
  color: string
  opacity: number
  shadowBlur: number
  shadowColor: string
}

export interface CanvasViewport {
  zoom: number
  panX: number
  panY: number
}

export const DEFAULT_FILL: FillConfig = {
  type: 'solid',
  color: '#4A90D9',
  opacity: 1,
}

export const DEFAULT_STROKE: StrokeConfig = {
  color: '#000000',
  width: 0,
  opacity: 1,
  dashArray: [],
  lineCap: 'round',
  lineJoin: 'round',
}

export const DEFAULT_SHADOW: ShadowConfig = {
  color: 'rgba(0,0,0,0.3)',
  blur: 10,
  offsetX: 0,
  offsetY: 4,
  enabled: false,
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 20,
  fontWeight: 'normal',
  fontStyle: 'normal',
  underline: false,
  linethrough: false,
  overline: false,
  textAlign: 'left',
  lineHeight: 1.2,
  charSpacing: 0,
  fill: '#1d1d1f',
}

export const DEFAULT_BRUSH: BrushSettings = {
  type: 'pencil',
  width: 3,
  color: '#1d1d1f',
  opacity: 1,
  shadowBlur: 0,
  shadowColor: 'rgba(0,0,0,0)',
}

export type ThemeMode = 'light' | 'dark'

export interface SnapshotEntry {
  id: string
  name: string
  canvasJSON: string
  timestamp: number
}

export interface SavedComponent {
  id: string
  name: string
  objectJSON: string
  thumbnail?: string
  createdAt: number
}

export const FONT_LIST = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Comic Sans MS',
  'Impact',
  'Lucida Console',
  'Tahoma',
  'Futura',
  'Gill Sans',
  'Optima',
  'Didot',
  'American Typewriter',
  'Brush Script MT',
]
