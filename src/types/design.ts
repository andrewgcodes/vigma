export type ToolType =
  | 'select'
  | 'hand'
  | 'frame'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'polygon'
  | 'star'
  | 'triangle'
  | 'text'
  | 'pen'
  | 'pencil'
  | 'eraser'
  | 'image'
  | 'eyedropper'
  | 'comment';

export type GradientType = 'linear' | 'radial';

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientFill {
  type: GradientType;
  angle: number;
  stops: GradientStop[];
}

export type FillType = 'solid' | 'gradient' | 'none';

export interface Fill {
  type: FillType;
  color: string;
  opacity: number;
  gradient?: GradientFill;
}

export interface Stroke {
  color: string;
  width: number;
  opacity: number;
  dashArray: number[];
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'miter' | 'round' | 'bevel';
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface BlurEffect {
  type: 'gaussian' | 'background';
  radius: number;
}

export interface DesignElement {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: Fill;
  stroke: Stroke;
  shadow?: Shadow;
  blur?: BlurEffect;
  cornerRadius: number;
  blendMode: string;
  parentId?: string;
  children?: string[];
  isGroup?: boolean;
  isFrame?: boolean;
  isComponent?: boolean;
  componentId?: string;
}

export interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  expanded: boolean;
  children: LayerItem[];
  depth: number;
}

export interface Page {
  id: string;
  name: string;
}

export interface GuidelineData {
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export interface HistoryEntry {
  canvasJSON: string;
  timestamp: number;
}

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  scale: number;
  quality: number;
  background: boolean;
  selectedOnly: boolean;
}

export interface AlignmentGuide {
  position: number;
  orientation: 'horizontal' | 'vertical';
}
