import type { Canvas } from "fabric";

export class CanvasHistory {
  private history: string[] = [];
  private currentIndex = -1;
  private maxHistory = 50;
  private isRestoring = false;

  saveState(canvas: Canvas) {
    if (this.isRestoring) return;

    const json = JSON.stringify(canvas.toJSON());

    // Remove any future states if we've undone
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(json);

    // Keep history within limits
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo(canvas: Canvas): boolean {
    if (this.currentIndex <= 0) return false;

    this.currentIndex--;
    this.restoreState(canvas);
    return true;
  }

  redo(canvas: Canvas): boolean {
    if (this.currentIndex >= this.history.length - 1) return false;

    this.currentIndex++;
    this.restoreState(canvas);
    return true;
  }

  private restoreState(canvas: Canvas) {
    this.isRestoring = true;
    const state = this.history[this.currentIndex];
    const parsed = JSON.parse(state);
    canvas.loadFromJSON(parsed).then(() => {
      canvas.renderAll();
      this.isRestoring = false;
    });
  }

  get canUndo(): boolean {
    return this.currentIndex > 0;
  }

  get canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}
