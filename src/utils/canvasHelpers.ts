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
  const buildLayer = (obj: FabricObject): LayerInfo => {
    const record = obj as unknown as Record<string, unknown>;

    // Ensure objects have IDs and names (especially after JSON restore)
    if (!record.objectId) {
      assignObjectId(obj);
    }
    if (!record.customName) {
      assignDefaultName(obj);
    }

    const isFrame = Boolean(record.isFrame);
    const type = isFrame ? 'frame' : (obj.type || 'object');

    let children: LayerInfo[] | undefined;
    if (obj.type === 'group') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groupChildren: FabricObject[] = ((obj as any)._objects as FabricObject[]) || [];
      if (groupChildren.length > 0) {
        children = groupChildren.map(buildLayer).reverse();
      }
    }

    return {
      id: getObjectId(obj),
      name: getObjectName(obj),
      type,
      visible: obj.visible !== false,
      locked: !obj.selectable,
      children,
      expanded: true,
    };
  };

  const objects = canvas
    .getObjects()
    .filter((obj) => {
      const record = obj as unknown as Record<string, unknown>;
      // Exclude the artboard background
      if (record.name === 'artboard') return false;
      // Exclude pen helper objects if any leaked
      if (record.isPenHelper) return false;
      return true;
    });

  return objects.map((obj) => buildLayer(obj)).reverse();
}

export function findObjectById(canvas: Canvas, id: string): FabricObject | undefined {
  const search = (objs: FabricObject[]): FabricObject | undefined => {
    for (const obj of objs) {
      if (getObjectId(obj) === id) return obj;
      if (obj.type === 'group') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const children: FabricObject[] = ((obj as any)._objects as FabricObject[]) || [];
        const found = search(children);
        if (found) return found;
      }
    }
    return undefined;
  };

  return search(canvas.getObjects());
}

export function saveCanvasJSON(canvas: Canvas): string {
  return JSON.stringify(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).toJSON([
      'objectId',
      'customName',
      'selectable',
      'evented',
      'name',
      'isFrame',
      'isPenHelper',
    ])
  );
}
