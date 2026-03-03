"use client";

import React, { useRef, useEffect, useCallback } from "react";
import * as fabric from "fabric";
import { useStore } from "@/store/useStore";
import { CanvasHistory } from "@/lib/canvasHistory";
import {
  createRectangle,
  createEllipse,
  createTriangle,
  createLine,
  createArrow,
  createStar,
  createPolygon,
  createTextbox,
  addImageToCanvas,
} from "@/lib/fabricUtils";
import type { LayerInfo } from "@/types";

interface DesignCanvasProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  historyRef: React.MutableRefObject<CanvasHistory>;
}

// Register custom properties so Fabric.js serializes/deserializes them
(fabric.FabricObject as unknown as { customProperties: string[] }).customProperties = ['id', 'name'];

export default function DesignCanvas({ canvasRef, historyRef }: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);

  // Drag-to-draw refs
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef({ x: 0, y: 0 });
  const drawingObjRef = useRef<fabric.FabricObject | null>(null);

  // Snap guides refs
  const snapGuidesRef = useRef<fabric.FabricObject[]>([]);

  const {
    activeTool,
    setActiveTool,
    setZoom,
    setSelectedObjectId,
    setLayers,
    fillColor,
    strokeColor,
    strokeWidth,
    cornerRadius,
    fontFamily,
    fontSize,
    fontWeight,
    penColor,
    penWidth,
    setCanUndo,
    setCanRedo,
    setContextMenu,
    clipboardData,
    setClipboardData,
  } = useStore();

  const syncLayers = useCallback((canvas: fabric.Canvas) => {
    const objects = canvas.getObjects().filter((obj) => !(obj as fabric.FabricObject & { _isSnapGuide?: boolean })._isSnapGuide);
    const layerInfos: LayerInfo[] = objects.map((obj) => {
      const o = obj as fabric.FabricObject & { id?: string; name?: string };
      return {
        id: o.id || "",
        name: o.name || "Object",
        type: obj.type || "object",
        visible: obj.visible !== false,
        locked: !obj.selectable,
      };
    });
    setLayers(layerInfos);
  }, [setLayers]);

  const saveHistory = useCallback(() => {
    if (canvasRef.current) {
      historyRef.current.saveState(canvasRef.current);
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
    }
  }, [canvasRef, historyRef, setCanUndo, setCanRedo]);

  // Clear snap guides
  const clearSnapGuides = useCallback((canvas: fabric.Canvas) => {
    snapGuidesRef.current.forEach((guide) => canvas.remove(guide));
    snapGuidesRef.current = [];
  }, []);

  // Get logical bounds (canvas-space, unaffected by zoom/pan)
  const getLogicalBounds = (obj: fabric.FabricObject) => {
    const left = obj.left || 0;
    const top = obj.top || 0;
    const w = (obj.width || 0) * (obj.scaleX || 1);
    const h = (obj.height || 0) * (obj.scaleY || 1);
    return { left, top, width: w, height: h };
  };

  // Show snap guides when moving objects
  const showSnapGuides = useCallback((canvas: fabric.Canvas, movingObj: fabric.FabricObject) => {
    clearSnapGuides(canvas);
    const SNAP_THRESHOLD = 8;
    const guides: fabric.FabricObject[] = [];
    const movingBounds = getLogicalBounds(movingObj);
    const movingCenterX = movingBounds.left + movingBounds.width / 2;
    const movingCenterY = movingBounds.top + movingBounds.height / 2;

    canvas.getObjects().forEach((obj) => {
      if (obj === movingObj || (obj as fabric.FabricObject & { _isSnapGuide?: boolean })._isSnapGuide) return;
      const bounds = getLogicalBounds(obj);
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;

      // Vertical center alignment
      if (Math.abs(movingCenterX - centerX) < SNAP_THRESHOLD) {
        const line = new fabric.Line([centerX, 0, centerX, canvas.height || 2000], {
          stroke: "#ff3b6b",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [4, 4],
        });
        (line as fabric.FabricObject & { _isSnapGuide?: boolean })._isSnapGuide = true;
        guides.push(line);
      }

      // Horizontal center alignment
      if (Math.abs(movingCenterY - centerY) < SNAP_THRESHOLD) {
        const line = new fabric.Line([0, centerY, canvas.width || 2000, centerY], {
          stroke: "#ff3b6b",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [4, 4],
        });
        (line as fabric.FabricObject & { _isSnapGuide?: boolean })._isSnapGuide = true;
        guides.push(line);
      }

      // Left edge alignment
      if (Math.abs(movingBounds.left - bounds.left) < SNAP_THRESHOLD) {
        const line = new fabric.Line([bounds.left, 0, bounds.left, canvas.height || 2000], {
          stroke: "#0071e3",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [4, 4],
        });
        (line as fabric.FabricObject & { _isSnapGuide?: boolean })._isSnapGuide = true;
        guides.push(line);
      }

      // Top edge alignment
      if (Math.abs(movingBounds.top - bounds.top) < SNAP_THRESHOLD) {
        const line = new fabric.Line([0, bounds.top, canvas.width || 2000, bounds.top], {
          stroke: "#0071e3",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [4, 4],
        });
        (line as fabric.FabricObject & { _isSnapGuide?: boolean })._isSnapGuide = true;
        guides.push(line);
      }
    });

    guides.forEach((guide) => canvas.add(guide));
    snapGuidesRef.current = guides;
  }, [clearSnapGuides]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasElRef.current || canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#f5f5f7",
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      uniformScaling: false,
    });

    // Custom selection style
    canvas.selectionColor = "rgba(0, 113, 227, 0.08)";
    canvas.selectionBorderColor = "#0071e3";
    canvas.selectionLineWidth = 1;

    canvasRef.current = canvas;

    // Draw grid pattern
    drawGrid(canvas);

    // Save initial state
    historyRef.current.saveState(canvas);

    // Resize handler
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      drawGrid(canvas);
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);

    // Object events
    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0] as fabric.FabricObject & { id?: string };
      if (obj?.id) {
        setSelectedObjectId(obj.id);
      }
    });

    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0] as fabric.FabricObject & { id?: string };
      if (obj?.id) {
        setSelectedObjectId(obj.id);
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedObjectId(null);
    });

    canvas.on("object:modified", () => {
      clearSnapGuides(canvas);
      saveHistory();
      syncLayers(canvas);
    });

    canvas.on("object:added", () => {
      syncLayers(canvas);
    });

    canvas.on("object:removed", () => {
      syncLayers(canvas);
    });

    // Snap guides on object moving
    canvas.on("object:moving", (e) => {
      if (e.target) {
        showSnapGuides(canvas, e.target);
      }
    });

    // Hover highlight
    canvas.on("mouse:over", (e) => {
      if (e.target && e.target !== canvas.getActiveObject()) {
        e.target.set("borderColor", "#0071e3");
        e.target.set("borderScaleFactor", 2);
        canvas.renderAll();
      }
    });

    canvas.on("mouse:out", (e) => {
      if (e.target) {
        e.target.set("borderColor", "#0071e3");
        e.target.set("borderScaleFactor", 1);
        canvas.renderAll();
      }
    });

    // Drag & drop image support
    const canvasEl = canvas.getSelectionElement();
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer?.files;
      if (files) {
        Array.from(files).forEach((file) => {
          if (file.type.startsWith("image/")) {
            addImageToCanvas(canvas, file).then(() => {
              saveHistory();
            });
          }
        });
      }
    };

    canvasEl.addEventListener("dragover", handleDragOver);
    canvasEl.addEventListener("drop", handleDrop);

    // Paste image from clipboard
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            addImageToCanvas(canvas, file).then(() => {
              saveHistory();
            });
          }
          return;
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvasEl.removeEventListener("dragover", handleDragOver);
      canvasEl.removeEventListener("drop", handleDrop);
      window.removeEventListener("paste", handlePaste);
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle tool changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = penColor;
      canvas.freeDrawingBrush.width = penWidth;
      canvas.selection = false;
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = activeTool === "select";
    }

    // Update cursor
    if (activeTool === "hand") {
      canvas.defaultCursor = "grab";
      canvas.hoverCursor = "grab";
    } else if (activeTool === "select") {
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
    } else if (activeTool === "pen") {
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";
    } else {
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";
    }

    // Make objects unselectable when not in select mode
    canvas.getObjects().forEach((obj) => {
      const o = obj as fabric.FabricObject & { _wasSelectable?: boolean; locked?: boolean; _isSnapGuide?: boolean };
      if (o._isSnapGuide) return;
      if (activeTool !== "select" && activeTool !== "pen") {
        o._wasSelectable = obj.selectable;
        obj.selectable = false;
        obj.evented = false;
      } else if (!o.locked) {
        obj.selectable = o._wasSelectable !== undefined ? o._wasSelectable : true;
        obj.evented = true;
      }
    });

    canvas.renderAll();
  }, [activeTool, penColor, penWidth, canvasRef]);

  // Mouse events for drag-to-draw, panning, and context menu
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
      const e = opt.e;
      const pointer = canvas.getScenePoint(e);
      const clientX = 'clientX' in e ? e.clientX : (e as TouchEvent).touches?.[0]?.clientX || 0;
      const clientY = 'clientY' in e ? e.clientY : (e as TouchEvent).touches?.[0]?.clientY || 0;

      // Close context menu on any click
      setContextMenu({ visible: false, x: 0, y: 0 });

      // Right-click context menu
      if ('button' in e && e.button === 2) {
        e.preventDefault();
        setContextMenu({ visible: true, x: clientX, y: clientY });
        return;
      }

      // Panning with space or hand tool
      if (spaceHeldRef.current || activeTool === "hand") {
        isPanningRef.current = true;
        lastPosRef.current = { x: clientX, y: clientY };
        canvas.defaultCursor = "grabbing";
        canvas.hoverCursor = "grabbing";
        return;
      }

      // Middle mouse pan
      if ('button' in e && e.button === 1) {
        isPanningRef.current = true;
        lastPosRef.current = { x: clientX, y: clientY };
        return;
      }

      if (activeTool === "select" || activeTool === "pen") return;

      // Text tool - click to place (no drag)
      if (activeTool === "text") {
        const obj = createTextbox(pointer.x, pointer.y, fillColor, fontFamily, fontSize, fontWeight);
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
        saveHistory();
        setActiveTool("select");
        return;
      }

      // Image tool - handled by file upload
      if (activeTool === "image") return;

      // Start drag-to-draw for shapes
      isDrawingRef.current = true;
      drawStartRef.current = { x: pointer.x, y: pointer.y };
      let obj: fabric.FabricObject | null = null;

      switch (activeTool) {
        case "rectangle":
          obj = createRectangle(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth, cornerRadius);
          obj.set({ width: 1, height: 1 });
          break;
        case "ellipse":
          obj = createEllipse(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth);
          (obj as fabric.Ellipse).set({ rx: 0.5, ry: 0.5 });
          break;
        case "triangle":
          obj = createTriangle(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth);
          obj.set({ width: 1, height: 1 });
          break;
        case "line":
          obj = createLine(pointer.x, pointer.y, strokeColor, strokeWidth || 2);
          break;
        case "arrow":
          obj = createArrow(pointer.x, pointer.y, strokeColor, strokeWidth || 2);
          break;
        case "star":
          obj = createStar(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth);
          obj.set({ scaleX: 0.01, scaleY: 0.01 });
          break;
        case "polygon":
          obj = createPolygon(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth);
          obj.set({ scaleX: 0.01, scaleY: 0.01 });
          break;
      }

      if (obj) {
        drawingObjRef.current = obj;
        canvas.add(obj);
        canvas.renderAll();
      }
    };

    const handleMouseMove = (opt: fabric.TPointerEventInfo) => {
      const e = opt.e;

      // Panning
      if (isPanningRef.current) {
        const vpt = canvas.viewportTransform;
        if (!vpt) return;
        const clientX = 'clientX' in e ? e.clientX : (e as TouchEvent).touches?.[0]?.clientX || 0;
        const clientY = 'clientY' in e ? e.clientY : (e as TouchEvent).touches?.[0]?.clientY || 0;
        vpt[4] += clientX - lastPosRef.current.x;
        vpt[5] += clientY - lastPosRef.current.y;
        lastPosRef.current = { x: clientX, y: clientY };
        canvas.requestRenderAll();
        return;
      }

      // Drag-to-draw
      if (isDrawingRef.current && drawingObjRef.current) {
        const pointer = canvas.getScenePoint(e);
        const startX = drawStartRef.current.x;
        const startY = drawStartRef.current.y;
        const obj = drawingObjRef.current;
        const dx = pointer.x - startX;
        const dy = pointer.y - startY;

        switch (activeTool) {
          case "rectangle":
          case "triangle":
            obj.set({
              left: dx >= 0 ? startX : pointer.x,
              top: dy >= 0 ? startY : pointer.y,
              width: Math.max(Math.abs(dx), 2),
              height: Math.max(Math.abs(dy), 2),
            });
            break;
          case "ellipse":
            (obj as fabric.Ellipse).set({
              left: dx >= 0 ? startX : pointer.x,
              top: dy >= 0 ? startY : pointer.y,
              rx: Math.max(Math.abs(dx) / 2, 1),
              ry: Math.max(Math.abs(dy) / 2, 1),
            });
            break;
          case "line":
            (obj as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
            break;
          case "arrow": {
            const dist = Math.sqrt(dx * dx + dy * dy);
            obj.set({ scaleX: Math.max(dist / 200, 0.01), scaleY: Math.max(dist / 200, 0.01) });
            break;
          }
          case "star":
          case "polygon": {
            const starDist = Math.sqrt(dx * dx + dy * dy);
            obj.set({ scaleX: Math.max(starDist / 80, 0.01), scaleY: Math.max(starDist / 80, 0.01) });
            break;
          }
        }
        obj.setCoords();
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        canvas.setViewportTransform(canvas.viewportTransform!);
        if (activeTool === "hand" || spaceHeldRef.current) {
          canvas.defaultCursor = "grab";
          canvas.hoverCursor = "grab";
        }
      }

      // Finish drag-to-draw
      if (isDrawingRef.current && drawingObjRef.current) {
        const obj = drawingObjRef.current;
        const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
        const h = (obj.height ?? 0) * (obj.scaleY ?? 1);

        // If just a click (no drag), set default size
        if (w < 5 && h < 5) {
          switch (activeTool) {
            case "rectangle": obj.set({ width: 200, height: 150 }); break;
            case "ellipse": (obj as fabric.Ellipse).set({ rx: 100, ry: 75 }); break;
            case "triangle": obj.set({ width: 180, height: 160 }); break;
            case "star": obj.set({ scaleX: 1, scaleY: 1 }); break;
            case "polygon": obj.set({ scaleX: 1, scaleY: 1 }); break;
          }
        }
        obj.setCoords();
        canvas.setActiveObject(obj);
        canvas.renderAll();
        saveHistory();
        setActiveTool("select");
        isDrawingRef.current = false;
        drawingObjRef.current = null;
      }
    };

    // Zoom with scroll
    const handleWheel = (opt: { e: WheelEvent }) => {
      const e = opt.e;
      e.preventDefault();
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** e.deltaY;
      newZoom = Math.min(Math.max(0.1, newZoom), 5);
      canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), newZoom);
      setZoom(Math.round(newZoom * 100));
    };

    // Path created from freehand drawing
    const handlePathCreated = () => {
      const objects = canvas.getObjects();
      const lastObj = objects[objects.length - 1] as fabric.FabricObject & { id?: string; name?: string };
      if (lastObj && !lastObj.id) {
        lastObj.id = `obj_${Date.now()}_draw`;
        lastObj.name = `Drawing ${objects.length}`;
      }
      saveHistory();
      syncLayers(canvas);
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    canvas.on("mouse:down", handleMouseDown as any);
    canvas.on("mouse:move", handleMouseMove as any);
    canvas.on("mouse:up", handleMouseUp as any);
    canvas.on("mouse:wheel", handleWheel as any);
    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("mouse:down", handleMouseDown as any);
      canvas.off("mouse:move", handleMouseMove as any);
      canvas.off("mouse:up", handleMouseUp as any);
      canvas.off("mouse:wheel", handleWheel as any);
      canvas.off("path:created", handlePathCreated);
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [activeTool, fillColor, strokeColor, strokeWidth, cornerRadius, fontFamily, fontSize, fontWeight, canvasRef, historyRef, saveHistory, syncLayers, setActiveTool, setZoom, setContextMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (!canvas) return;

      const key = e.key.toLowerCase();

      // Space for panning
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        canvas.defaultCursor = "grab";
        canvas.hoverCursor = "grab";
        canvas.selection = false;
        return;
      }

      // Escape - deselect
      if (e.key === "Escape") {
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObjectId(null);
        setContextMenu({ visible: false, x: 0, y: 0 });
        return;
      }

      // Arrow keys - nudge objects (1px, Shift+10px)
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          e.preventDefault();
          const nudge = e.shiftKey ? 10 : 1;
          switch (e.key) {
            case "ArrowUp": activeObj.set("top", (activeObj.top || 0) - nudge); break;
            case "ArrowDown": activeObj.set("top", (activeObj.top || 0) + nudge); break;
            case "ArrowLeft": activeObj.set("left", (activeObj.left || 0) - nudge); break;
            case "ArrowRight": activeObj.set("left", (activeObj.left || 0) + nudge); break;
          }
          activeObj.setCoords();
          canvas.renderAll();
          saveHistory();
        }
        return;
      }

      // Tool shortcuts (no modifier keys)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        switch (key) {
          case "v": setActiveTool("select"); return;
          case "h": setActiveTool("hand"); return;
          case "r": setActiveTool("rectangle"); return;
          case "o": setActiveTool("ellipse"); return;
          case "l": setActiveTool("line"); return;
          case "a": setActiveTool("arrow"); return;
          case "p": setActiveTool("pen"); return;
          case "t": setActiveTool("text"); return;
          case "s": setActiveTool("star"); return;
          case "n": setActiveTool("polygon"); return;
        }
      }

      // Delete selected objects
      if (e.key === "Delete" || (e.key === "Backspace" && !e.ctrlKey && !e.metaKey)) {
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
          active.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          saveHistory();
          setSelectedObjectId(null);
        }
        return;
      }

      // --- Ctrl/Cmd shortcuts ---
      if (!(e.ctrlKey || e.metaKey)) return;

      // Ctrl+A - Select All
      if (key === "a" && !e.shiftKey) {
        e.preventDefault();
        const objects = canvas.getObjects().filter((o) => !(o as fabric.FabricObject & { _isSnapGuide?: boolean })._isSnapGuide);
        if (objects.length > 0) {
          const sel = new fabric.ActiveSelection(objects, { canvas });
          canvas.setActiveObject(sel);
          canvas.renderAll();
        }
        return;
      }

      // Ctrl+Z - Undo
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        historyRef.current.undo(canvas).then((didUndo) => {
          if (didUndo) {
            setCanUndo(historyRef.current.canUndo);
            setCanRedo(historyRef.current.canRedo);
            syncLayers(canvas);
          }
        });
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y - Redo
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        historyRef.current.redo(canvas).then((didRedo) => {
          if (didRedo) {
            setCanUndo(historyRef.current.canUndo);
            setCanRedo(historyRef.current.canRedo);
            syncLayers(canvas);
          }
        });
        return;
      }

      // Ctrl+C - Copy
      if (key === "c" && !e.shiftKey) {
        e.preventDefault();
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          activeObj.clone().then((cloned: fabric.FabricObject) => {
            const json = JSON.stringify(cloned.toJSON());
            setClipboardData(json);
          });
        }
        return;
      }

      // Ctrl+X - Cut
      if (key === "x" && !e.shiftKey) {
        e.preventDefault();
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          activeObj.clone().then((cloned: fabric.FabricObject) => {
            const json = JSON.stringify(cloned.toJSON());
            setClipboardData(json);
            const activeObjs = canvas.getActiveObjects();
            activeObjs.forEach((obj) => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.renderAll();
            saveHistory();
            setSelectedObjectId(null);
          });
        }
        return;
      }

      // Ctrl+V - Paste
      if (key === "v" && !e.shiftKey) {
        e.preventDefault();
        if (clipboardData) {
          try {
            const parsed = JSON.parse(clipboardData);
            fabric.util.enlivenObjects([parsed]).then((enlivened) => {
              const objects = enlivened as fabric.FabricObject[];
              if (objects.length > 0) {
                const obj = objects[0];
                obj.set({
                  left: (obj.left || 0) + 20,
                  top: (obj.top || 0) + 20,
                });
                const o = obj as fabric.FabricObject & { id?: string; name?: string };
                o.id = `obj_${Date.now()}_paste`;
                o.name = (o.name || "Object") + " Copy";
                canvas.add(obj);
                canvas.setActiveObject(obj);
                canvas.renderAll();
                saveHistory();
                // Update clipboard so next paste cascades offset
                setClipboardData(JSON.stringify(obj.toJSON()));
              }
            });
          } catch {
            // ignore parse errors
          }
        }
        return;
      }

      // Ctrl+D - Duplicate
      if (key === "d") {
        e.preventDefault();
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          activeObj.clone().then((cloned: fabric.FabricObject) => {
            cloned.set({
              left: (cloned.left || 0) + 20,
              top: (cloned.top || 0) + 20,
            });
            const c = cloned as fabric.FabricObject & { id?: string; name?: string };
            c.id = `obj_${Date.now()}_clone`;
            c.name = `${(activeObj as fabric.FabricObject & { name?: string }).name || "Object"} Copy`;
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            saveHistory();
          });
        }
        return;
      }

      // Ctrl+G - Group
      if (key === "g" && !e.shiftKey) {
        e.preventDefault();
        const activeSelection = canvas.getActiveObject();
        if (activeSelection && activeSelection.type === "activeselection") {
          const sel = activeSelection as fabric.ActiveSelection;
          const objects = sel.getObjects();
          if (objects.length > 1) {
            canvas.discardActiveObject();
            const group = new fabric.Group(objects);
            objects.forEach((obj) => canvas.remove(obj));
            const g = group as fabric.Group & { id?: string; name?: string };
            g.id = `obj_${Date.now()}_group`;
            g.name = `Group ${canvas.getObjects().length + 1}`;
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.renderAll();
            saveHistory();
          }
        }
        return;
      }

      // Ctrl+Shift+G - Ungroup
      if (key === "g" && e.shiftKey) {
        e.preventDefault();
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.type === "group") {
          const group = activeObj as fabric.Group;
          const items = [...group.getObjects()];
          group.removeAll();
          canvas.remove(group);
          const sel: fabric.FabricObject[] = [];
          items.forEach((item) => {
            canvas.add(item);
            sel.push(item);
          });
          const activeSelection = new fabric.ActiveSelection(sel, { canvas });
          canvas.setActiveObject(activeSelection);
          canvas.renderAll();
          saveHistory();
        }
        return;
      }

      // Ctrl+] - Bring Forward (unshifted bracket)
      if (e.key === "]" && !e.shiftKey) {
        e.preventDefault();
        const obj = canvas.getActiveObject();
        if (obj) {
          const objects = canvas.getObjects();
          const idx = objects.indexOf(obj);
          if (idx < objects.length - 1) {
            canvas.moveObjectTo(obj, idx + 1);
            canvas.renderAll();
            syncLayers(canvas);
          }
        }
        return;
      }

      // Ctrl+[ - Send Backward (unshifted bracket)
      if (e.key === "[" && !e.shiftKey) {
        e.preventDefault();
        const obj = canvas.getActiveObject();
        if (obj) {
          const objects = canvas.getObjects();
          const idx = objects.indexOf(obj);
          if (idx > 0) {
            canvas.moveObjectTo(obj, idx - 1);
            canvas.renderAll();
            syncLayers(canvas);
          }
        }
        return;
      }

      // Ctrl+Shift+] / Ctrl+} - Bring to Front
      if (e.key === "}" || (e.key === "]" && e.shiftKey)) {
        e.preventDefault();
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.moveObjectTo(obj, canvas.getObjects().length - 1);
          canvas.renderAll();
          syncLayers(canvas);
        }
        return;
      }

      // Ctrl+Shift+[ / Ctrl+{ - Send to Back
      if (e.key === "{" || (e.key === "[" && e.shiftKey)) {
        e.preventDefault();
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.moveObjectTo(obj, 0);
          canvas.renderAll();
          syncLayers(canvas);
        }
        return;
      }

      // Ctrl+0 - Reset zoom
      if (e.key === "0") {
        e.preventDefault();
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(100);
        return;
      }

      // Ctrl+= / Ctrl++ - Zoom in
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        let newZoom = canvas.getZoom() * 1.15;
        newZoom = Math.min(newZoom, 5);
        const center = canvas.getCenterPoint();
        canvas.zoomToPoint(center, newZoom);
        setZoom(Math.round(newZoom * 100));
        return;
      }

      // Ctrl+- - Zoom out
      if (e.key === "-") {
        e.preventDefault();
        let newZoom = canvas.getZoom() / 1.15;
        newZoom = Math.max(newZoom, 0.1);
        const center = canvas.getCenterPoint();
        canvas.zoomToPoint(center, newZoom);
        setZoom(Math.round(newZoom * 100));
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
        if (canvas && activeTool !== "hand") {
          canvas.defaultCursor = activeTool === "select" ? "default" : "crosshair";
          canvas.hoverCursor = activeTool === "select" ? "move" : "crosshair";
          canvas.selection = activeTool === "select";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeTool, canvasRef, historyRef, clipboardData, saveHistory, syncLayers, setActiveTool, setSelectedObjectId, setCanUndo, setCanRedo, setZoom, setClipboardData, setContextMenu]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasElRef} />
    </div>
  );
}

function drawGrid(canvas: fabric.Canvas) {
  const gridSize = 20;
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = gridSize;
  patternCanvas.height = gridSize;
  const ctx = patternCanvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#f5f5f7";
  ctx.fillRect(0, 0, gridSize, gridSize);
  ctx.fillStyle = "#e0e0e2";
  ctx.beginPath();
  ctx.arc(gridSize / 2, gridSize / 2, 0.8, 0, Math.PI * 2);
  ctx.fill();

  const pattern = new fabric.Pattern({
    source: patternCanvas,
    repeat: "repeat",
  });

  canvas.backgroundColor = pattern as unknown as string;
  canvas.renderAll();
}
