export const DEFAULT_FILL = '#7c5cfccc';
export const DEFAULT_STROKE = '#5a3fd6';
export const DEFAULT_STROKE_WIDTH = 1;
export const LINE_STROKE = '#ffffff';
export const LINE_STROKE_WIDTH = 2;
export const ARTBOARD_WIDTH = 1200;
export const ARTBOARD_HEIGHT = 800;

export const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#374151', '#d1d5db', '#fca5a5', '#fdba74', '#fde047',
  '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f9a8d4',
];

export function getDefaultName(type: string, count: number): string {
  const typeMap: Record<string, string> = {
    rect: 'Rectangle',
    ellipse: 'Ellipse',
    triangle: 'Triangle',
    line: 'Line',
    path: 'Path',
    textbox: 'Text',
    image: 'Image',
    group: 'Group',
    polygon: 'Star',
  };
  return `${typeMap[type] || 'Object'} ${count}`;
}

export function getLayerIcon(type: string): string {
  const iconMap: Record<string, string> = {
    rect: 'Square',
    ellipse: 'Circle',
    triangle: 'Triangle',
    line: 'Minus',
    path: 'Pencil',
    textbox: 'Type',
    image: 'Image',
    group: 'Group',
    polygon: 'Star',
  };
  return iconMap[type] || 'Square';
}
