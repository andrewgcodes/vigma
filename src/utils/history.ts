import type * as fabric from 'fabric';

export class HistoryManager {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private canvas: fabric.Canvas | null = null;
  private isRestoring = false;
  private maxHistory = 50;
  private onChangeCallbacks: Array<(canUndo: boolean, canRedo: boolean) => void> = [];
  private onRestoreCallbacks: Array<() => void> = [];

  init(canvas: fabric.Canvas) {
    // Reset all state to prevent stale data from previous canvas instances
    this.undoStack = [];
    this.redoStack = [];
    this.onChangeCallbacks = [];
    this.onRestoreCallbacks = [];
    this.isRestoring = false;
    this.canvas = canvas;
    this.saveState();
  }

  onChange(cb: (canUndo: boolean, canRedo: boolean) => void) {
    this.onChangeCallbacks.push(cb);
  }

  onRestore(cb: () => void) {
    this.onRestoreCallbacks.push(cb);
  }

  private notifyRestore() {
    this.onRestoreCallbacks.forEach((cb) => cb());
  }

  private notify() {
    const canUndo = this.undoStack.length > 1;
    const canRedo = this.redoStack.length > 0;
    this.onChangeCallbacks.forEach((cb) => cb(canUndo, canRedo));
  }

  saveState() {
    if (!this.canvas || this.isRestoring) return;
    const json = JSON.stringify(this.canvas.toJSON());
    this.undoStack.push(json);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify();
  }

  async undo() {
    if (!this.canvas || this.undoStack.length <= 1 || this.isRestoring) return;
    this.isRestoring = true;
    try {
      const current = this.undoStack.pop();
      if (current) this.redoStack.push(current);
      const prev = this.undoStack[this.undoStack.length - 1];
      if (prev) {
        await this.canvas.loadFromJSON(prev);
        this.canvas.renderAll();
      }
    } finally {
      this.isRestoring = false;
      this.notify();
      this.notifyRestore();
    }
  }

  async redo() {
    if (!this.canvas || this.redoStack.length === 0 || this.isRestoring) return;
    this.isRestoring = true;
    try {
      const next = this.redoStack.pop();
      if (next) {
        this.undoStack.push(next);
        await this.canvas.loadFromJSON(next);
        this.canvas.renderAll();
      }
    } finally {
      this.isRestoring = false;
      this.notify();
      this.notifyRestore();
    }
  }

  get canUndo() {
    return this.undoStack.length > 1;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}

export const historyManager = new HistoryManager();
