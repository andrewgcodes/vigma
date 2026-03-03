import { Canvas, FabricObject } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import type { LayerInfo } from '../types';
import { getDefaultName } from './defaultStyles';

const objectCounters: Record<string, number> = {};

export function assignObjectId(obj: FabricObject): string {
  const id = uuidv4();
  (obj as unknown as Record<string, unknown>).objectId = id;
  return id;
}

export function getObjectId(obj: FabricObject): string {
  return (obj as unknown as Record<string, string>).objectId || '';
}

export function assignDefaultName(obj: FabricObject): string {
  const type = obj.type || 'object';
  objectCounters[type] = (objectCounters[type] || 0) + 1;
  const name = getDefaultName(type, objectCounters[type]);
  (obj as unknown as Record<string, unknown>).customName = name;
  return name;
}

export function getObjectName(obj: FabricObject): string {
  return (obj as unknown as Record<string, string>).customName || obj.type || 'Object';
}

export function setObjectName(obj: FabricObject, name: string): void {
  (obj as unknown as Record<string, unknown>).customName = name;
}

export function getLayersFromCanvas(canvas: Canvas): LayerInfo[] {
  const objects = canvas.getObjects().filter(
    (obj) => (obj as unknown as Record<string, unknown>).customName !== undefined
  );
  return objects.map((obj) => ({
    id: getObjectId(obj),
    name: getObjectName(obj),
    type: obj.type || 'object',
    visible: obj.visible !== false,
    locked: !obj.selectable,
  })).reverse();
}

export function findObjectById(canvas: Canvas, id: string): FabricObject | undefined {
  return canvas.getObjects().find((obj) => getObjectId(obj) === id);
}

export function saveCanvasJSON(canvas: Canvas): string {
  return JSON.stringify(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).toJSON(['objectId', 'customName', 'selectable', 'evented', 'name'])
  );
}
