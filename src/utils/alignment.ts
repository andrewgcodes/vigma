import type * as fabric from 'fabric';

export type AlignType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';
export type DistributeType = 'horizontal' | 'vertical';

export function alignObjects(canvas: fabric.Canvas, type: AlignType) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  if (activeObject.type === 'activeselection') {
    const selection = activeObject as fabric.ActiveSelection;
    const objects = selection.getObjects();
    if (objects.length < 2) return;

    const bound = selection.getBoundingRect();

    objects.forEach((obj) => {
      const objBound = obj.getBoundingRect();
      switch (type) {
        case 'left':
          obj.set('left', (obj.left ?? 0) + (bound.left - objBound.left));
          break;
        case 'right':
          obj.set('left', (obj.left ?? 0) + (bound.left + bound.width - objBound.left - objBound.width));
          break;
        case 'center-h':
          obj.set('left', (obj.left ?? 0) + (bound.left + bound.width / 2 - objBound.left - objBound.width / 2));
          break;
        case 'top':
          obj.set('top', (obj.top ?? 0) + (bound.top - objBound.top));
          break;
        case 'bottom':
          obj.set('top', (obj.top ?? 0) + (bound.top + bound.height - objBound.top - objBound.height));
          break;
        case 'center-v':
          obj.set('top', (obj.top ?? 0) + (bound.top + bound.height / 2 - objBound.top - objBound.height / 2));
          break;
      }
      obj.setCoords();
    });
    canvas.renderAll();
  }
}

export function distributeObjects(canvas: fabric.Canvas, type: DistributeType) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject || activeObject.type !== 'activeselection') return;

  const selection = activeObject as fabric.ActiveSelection;
  const objects = selection.getObjects();
  if (objects.length < 3) return;

  if (type === 'horizontal') {
    const sorted = [...objects].sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
    const first = sorted[0].getBoundingRect();
    const last = sorted[sorted.length - 1].getBoundingRect();
    const totalWidth = sorted.reduce((sum, obj) => sum + obj.getBoundingRect().width, 0);
    const totalSpace = last.left + last.width - first.left - totalWidth;
    const gap = totalSpace / (sorted.length - 1);

    let currentX = first.left;
    sorted.forEach((obj) => {
      const bound = obj.getBoundingRect();
      obj.set('left', (obj.left ?? 0) + (currentX - bound.left));
      obj.setCoords();
      currentX += bound.width + gap;
    });
  } else {
    const sorted = [...objects].sort((a, b) => (a.top ?? 0) - (b.top ?? 0));
    const first = sorted[0].getBoundingRect();
    const last = sorted[sorted.length - 1].getBoundingRect();
    const totalHeight = sorted.reduce((sum, obj) => sum + obj.getBoundingRect().height, 0);
    const totalSpace = last.top + last.height - first.top - totalHeight;
    const gap = totalSpace / (sorted.length - 1);

    let currentY = first.top;
    sorted.forEach((obj) => {
      const bound = obj.getBoundingRect();
      obj.set('top', (obj.top ?? 0) + (currentY - bound.top));
      obj.setCoords();
      currentY += bound.height + gap;
    });
  }
  canvas.renderAll();
}
