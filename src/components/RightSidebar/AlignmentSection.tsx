import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
} from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface AlignmentSectionProps {
  obj: FabricObject;
}

export default function AlignmentSection({ obj }: AlignmentSectionProps) {
  const { canvasRef } = useAppContext();

  const align = (direction: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    // For multi-selection alignment
    const objects = canvas.getActiveObjects();
    if (objects.length > 1) {
      const bounds = activeObj.getBoundingRect();
      objects.forEach((o) => {
        const objBounds = o.getBoundingRect();
        switch (direction) {
          case 'left':
            o.set({ left: (o.left || 0) + (bounds.left - objBounds.left) });
            break;
          case 'h-center':
            o.set({ left: (o.left || 0) + (bounds.left + bounds.width / 2 - (objBounds.left + objBounds.width / 2)) });
            break;
          case 'right':
            o.set({ left: (o.left || 0) + (bounds.left + bounds.width - (objBounds.left + objBounds.width)) });
            break;
          case 'top':
            o.set({ top: (o.top || 0) + (bounds.top - objBounds.top) });
            break;
          case 'v-center':
            o.set({ top: (o.top || 0) + (bounds.top + bounds.height / 2 - (objBounds.top + objBounds.height / 2)) });
            break;
          case 'bottom':
            o.set({ top: (o.top || 0) + (bounds.top + bounds.height - (objBounds.top + objBounds.height)) });
            break;
        }
        o.setCoords();
      });
    } else {
      // Single object - align to artboard
      const artboard = canvas.getObjects().find((o) => {
        const rec = o as unknown as Record<string, unknown>;
        return rec.name === 'artboard';
      });
      if (!artboard) return;
      const aLeft = artboard.left || 0;
      const aTop = artboard.top || 0;
      const aWidth = artboard.width || 0;
      const aHeight = artboard.height || 0;
      const objBounds = obj.getBoundingRect();
      const objW = objBounds.width;
      const objH = objBounds.height;

      switch (direction) {
        case 'left':
          obj.set({ left: aLeft + ((obj.left || 0) - objBounds.left) });
          break;
        case 'h-center':
          obj.set({ left: aLeft + aWidth / 2 - objW / 2 + ((obj.left || 0) - objBounds.left) });
          break;
        case 'right':
          obj.set({ left: aLeft + aWidth - objW + ((obj.left || 0) - objBounds.left) });
          break;
        case 'top':
          obj.set({ top: aTop + ((obj.top || 0) - objBounds.top) });
          break;
        case 'v-center':
          obj.set({ top: aTop + aHeight / 2 - objH / 2 + ((obj.top || 0) - objBounds.top) });
          break;
        case 'bottom':
          obj.set({ top: aTop + aHeight - objH + ((obj.top || 0) - objBounds.top) });
          break;
      }
      obj.setCoords();
    }

    // Handle distribute
    if (direction === 'h-distribute' || direction === 'v-distribute') {
      if (objects.length < 3) return;
      const sorted = [...objects].sort((a, b) => {
        if (direction === 'h-distribute') {
          return (a.left || 0) - (b.left || 0);
        }
        return (a.top || 0) - (b.top || 0);
      });
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (direction === 'h-distribute') {
        const firstBounds = first.getBoundingRect();
        const lastBounds = last.getBoundingRect();
        const totalWidth = sorted.reduce((sum, o) => sum + o.getBoundingRect().width, 0);
        const totalSpace = (lastBounds.left + lastBounds.width) - firstBounds.left - totalWidth;
        const gap = totalSpace / (sorted.length - 1);
        let currentX = firstBounds.left + firstBounds.width + gap;
        for (let i = 1; i < sorted.length - 1; i++) {
          const oBounds = sorted[i].getBoundingRect();
          sorted[i].set({ left: (sorted[i].left || 0) + (currentX - oBounds.left) });
          sorted[i].setCoords();
          currentX += oBounds.width + gap;
        }
      } else {
        const firstBounds = first.getBoundingRect();
        const lastBounds = last.getBoundingRect();
        const totalHeight = sorted.reduce((sum, o) => sum + o.getBoundingRect().height, 0);
        const totalSpace = (lastBounds.top + lastBounds.height) - firstBounds.top - totalHeight;
        const gap = totalSpace / (sorted.length - 1);
        let currentY = firstBounds.top + firstBounds.height + gap;
        for (let i = 1; i < sorted.length - 1; i++) {
          const oBounds = sorted[i].getBoundingRect();
          sorted[i].set({ top: (sorted[i].top || 0) + (currentY - oBounds.top) });
          sorted[i].setCoords();
          currentY += oBounds.height + gap;
        }
      }
    }

    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
    window.dispatchEvent(new CustomEvent('vigma:props-update'));
  };

  const buttons = [
    { icon: <AlignHorizontalJustifyStart size={14} />, action: 'left', tooltip: 'Align left' },
    { icon: <AlignHorizontalJustifyCenter size={14} />, action: 'h-center', tooltip: 'Align horizontal center' },
    { icon: <AlignHorizontalJustifyEnd size={14} />, action: 'right', tooltip: 'Align right' },
    { icon: <AlignVerticalJustifyStart size={14} />, action: 'top', tooltip: 'Align top' },
    { icon: <AlignVerticalJustifyCenter size={14} />, action: 'v-center', tooltip: 'Align vertical center' },
    { icon: <AlignVerticalJustifyEnd size={14} />, action: 'bottom', tooltip: 'Align bottom' },
    { icon: <AlignHorizontalSpaceBetween size={14} />, action: 'h-distribute', tooltip: 'Distribute horizontally' },
    { icon: <AlignVerticalSpaceBetween size={14} />, action: 'v-distribute', tooltip: 'Distribute vertically' },
  ];

  return (
    <div className="px-3 py-2">
      <label className="text-[11px] text-[#a0a0a0] font-medium uppercase tracking-wider mb-1 block">Alignment</label>
      <div className="flex gap-0.5 flex-wrap">
        {buttons.map((b) => (
          <button
            key={b.action}
            className="p-1.5 rounded text-[#a0a0a0] hover:bg-[#3c3c3c] hover:text-white transition-colors cursor-pointer"
            onClick={() => align(b.action)}
            title={b.tooltip}
          >
            {b.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
