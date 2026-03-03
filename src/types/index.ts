export type ToolType =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'star'
  | 'polygon'
  | 'text'
  | 'draw'
  | 'image'
  | 'ellipse';

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ObjectProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  rx: number;
  ry: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  text: string;
  scaleX: number;
  scaleY: number;
}
