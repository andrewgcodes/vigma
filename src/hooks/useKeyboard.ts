'use client';

import { useEffect } from 'react';
import { useDesignStore } from '@/store/useDesignStore';

interface KeyboardActions {
  handleUndo: () => void;
  handleRedo: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copyToClipboard: () => void;
  pasteFromClipboard: () => void;
  selectAll: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  lockObject: () => void;
  exportCanvas: (format: string) => void;
}

export function useKeyboard(actions: KeyboardActions) {
  const setActiveTool = useDesignStore((s) => s.setActiveTool);
  const toggleGrid = useDesignStore((s) => s.toggleGrid);
  const toggleRulers = useDesignStore((s) => s.toggleRulers);
  const toggleSnapToGrid = useDesignStore((s) => s.toggleSnapToGrid);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      const isCmd = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Tool shortcuts
      if (!isCmd && !isShift) {
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('select'); return;
          case 'h': setActiveTool('hand'); return;
          case 'r': setActiveTool('rectangle'); return;
          case 'o': setActiveTool('ellipse'); return;
          case 'l': setActiveTool('line'); return;
          case 't': setActiveTool('text'); return;
          case 'p': setActiveTool('pen'); return;
          case 'b': setActiveTool('pencil'); return;
          case 'e': setActiveTool('eraser'); return;
          case 'f': setActiveTool('frame'); return;
          case 'i': setActiveTool('eyedropper'); return;
          case 'a': setActiveTool('arrow'); return;
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isCmd) {
          e.preventDefault();
          actions.deleteSelected();
          return;
        }
      }

      // Escape
      if (e.key === 'Escape') {
        setActiveTool('select');
        return;
      }

      // Command shortcuts
      if (isCmd) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (isShift) {
              actions.handleRedo();
            } else {
              actions.handleUndo();
            }
            return;
          case 'y':
            e.preventDefault();
            actions.handleRedo();
            return;
          case 'c':
            e.preventDefault();
            actions.copyToClipboard();
            return;
          case 'v':
            e.preventDefault();
            actions.pasteFromClipboard();
            return;
          case 'd':
            e.preventDefault();
            actions.duplicateSelected();
            return;
          case 'a':
            e.preventDefault();
            actions.selectAll();
            return;
          case 'g':
            e.preventDefault();
            if (isShift) {
              actions.ungroupSelected();
            } else {
              actions.groupSelected();
            }
            return;
          case ']':
            e.preventDefault();
            if (isShift) {
              actions.bringToFront();
            } else {
              actions.bringForward();
            }
            return;
          case '[':
            e.preventDefault();
            if (isShift) {
              actions.sendToBack();
            } else {
              actions.sendBackward();
            }
            return;
          case '0':
            e.preventDefault();
            actions.resetZoom();
            return;
          case '1':
            e.preventDefault();
            actions.zoomToFit();
            return;
          case 'e':
            e.preventDefault();
            actions.exportCanvas('png');
            return;
          case 's':
            e.preventDefault();
            actions.exportCanvas('json');
            return;
          case '\'':
            e.preventDefault();
            toggleGrid();
            return;
        }
      }

      // Shift shortcuts
      if (isShift && !isCmd) {
        switch (e.key.toLowerCase()) {
          case 'r':
            toggleRulers();
            return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, setActiveTool, toggleGrid, toggleRulers, toggleSnapToGrid]);
}
