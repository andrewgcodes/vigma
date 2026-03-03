export type ToolType =
  | "select"
  | "rectangle"
  | "ellipse"
  | "triangle"
  | "line"
  | "arrow"
  | "star"
  | "text"
  | "pen"
  | "image"
  | "hand";

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

export interface CanvasObjectProps {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rx?: number;
  ry?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  underline?: boolean;
  linethrough?: boolean;
  text?: string;
  scaleX: number;
  scaleY: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  } | null;
  flipX?: boolean;
  flipY?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}
