export type ToolType =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'text'
  | 'pen'
  | 'image'
  | 'frame';

export interface CanvasObject {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface HistoryEntry {
  json: string;
  timestamp: number;
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'json' | 'pdf';
  quality: number;
  multiplier: number;
  backgroundColor: string | null;
}

export interface AlignType {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'middle' | 'bottom';
}

export interface GradientStop {
  offset: number;
  color: string;
}

export interface FillConfig {
  type: 'solid' | 'linear' | 'radial';
  color: string;
  gradientStops?: GradientStop[];
  gradientAngle?: number;
}
