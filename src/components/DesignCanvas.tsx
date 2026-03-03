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
  createTextbox,
  addImageToCanvas,
  exportCanvasAsPNG,
  exportCanvasAsSVG,
  exportCanvasAsJSON,
  loadCanvasFromJSON,
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

  const {
    activeTool,
    setActiveTool,
    zoom,
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
  } = useStore();

  const syncLayers = useCallback((canvas: fabric.Canvas) => {
    const objects = canvas.getObjects();
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
      saveHistory();
      syncLayers(canvas);
    });

    canvas.on("object:added", () => {
      syncLayers(canvas);
    });

    canvas.on("object:removed", () => {
      syncLayers(canvas);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
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
      const o = obj as fabric.FabricObject & { _wasSelectable?: boolean; locked?: boolean };
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

  // Mouse events for shape creation and panning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
      const e = opt.e;
      const pointer = canvas.getScenePoint(e);

      // Get client coordinates (works for both mouse and touch)
      const clientX = 'clientX' in e ? e.clientX : (e as TouchEvent).touches?.[0]?.clientX || 0;
      const clientY = 'clientY' in e ? e.clientY : (e as TouchEvent).touches?.[0]?.clientY || 0;

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

      // Create shapes
      let obj: fabric.FabricObject | null = null;

      switch (activeTool) {
        case "rectangle":
          obj = createRectangle(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth, cornerRadius);
          break;
        case "ellipse":
          obj = createEllipse(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth);
          break;
        case "triangle":
          obj = createTriangle(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth);
          break;
        case "line":
          obj = createLine(pointer.x, pointer.y, strokeColor, strokeWidth || 2);
          break;
        case "arrow":
          obj = createArrow(pointer.x, pointer.y, strokeColor, strokeWidth || 2);
          break;
        case "star":
          obj = createStar(pointer.x, pointer.y, fillColor, strokeColor, strokeWidth);
          break;
        case "text":
          obj = createTextbox(pointer.x, pointer.y, fillColor, fontFamily, fontSize, fontWeight);
          break;
        case "image":
          // Handled separately via file upload
          break;
      }

      if (obj) {
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
        saveHistory();
        setActiveTool("select");
      }
    };

    const handleMouseMove = (opt: fabric.TPointerEventInfo) => {
      if (!isPanningRef.current) return;
      const e = opt.e;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      const clientX = 'clientX' in e ? e.clientX : (e as TouchEvent).touches?.[0]?.clientX || 0;
      const clientY = 'clientY' in e ? e.clientY : (e as TouchEvent).touches?.[0]?.clientY || 0;

      vpt[4] += clientX - lastPosRef.current.x;
      vpt[5] += clientY - lastPosRef.current.y;
      lastPosRef.current = { x: clientX, y: clientY };
      canvas.requestRenderAll();
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
    };

    // Zoom with scroll
    const handleWheel = (opt: { e: WheelEvent }) => {
      const e = opt.e;
      e.preventDefault();

      const delta = e.deltaY;
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** delta;
      newZoom = Math.min(Math.max(0.1, newZoom), 5);

      canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), newZoom);
      setZoom(Math.round(newZoom * 100));
    };

    // Path created from drawing
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
  }, [activeTool, fillColor, strokeColor, strokeWidth, cornerRadius, fontFamily, fontSize, fontWeight, canvasRef, historyRef, saveHistory, syncLayers, setActiveTool, setZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Space for panning
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        canvas.defaultCursor = "grab";
        canvas.hoverCursor = "grab";
        canvas.selection = false;
        return;
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            setActiveTool("select");
            break;
          case "h":
            setActiveTool("hand");
            break;
          case "r":
            setActiveTool("rectangle");
            break;
          case "o":
            setActiveTool("ellipse");
            break;
          case "l":
            setActiveTool("line");
            break;
          case "a":
            setActiveTool("arrow");
            break;
          case "p":
            setActiveTool("pen");
            break;
          case "t":
            setActiveTool("text");
            break;
          case "s":
            setActiveTool("star");
            break;
        }
      }

      // Delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
          active.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          saveHistory();
          setSelectedObjectId(null);
        }
      }

      // Ctrl+Z Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        historyRef.current.undo(canvas).then((didUndo) => {
          if (didUndo) {
            setCanUndo(historyRef.current.canUndo);
            setCanRedo(historyRef.current.canRedo);
            syncLayers(canvas);
          }
        });
      }

      // Ctrl+Shift+Z or Ctrl+Y Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        historyRef.current.redo(canvas).then((didRedo) => {
          if (didRedo) {
            setCanUndo(historyRef.current.canUndo);
            setCanRedo(historyRef.current.canRedo);
            syncLayers(canvas);
          }
        });
      }

      // Ctrl+D Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
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
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
        const canvas = canvasRef.current;
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
  }, [activeTool, canvasRef, historyRef, saveHistory, syncLayers, setActiveTool, setSelectedObjectId, setCanUndo, setCanRedo]);

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
  // We draw a subtle dot grid as background
  const gridSize = 20;
  const width = canvas.width || window.innerWidth;
  const height = canvas.height || window.innerHeight;

  // Create a pattern using a small canvas
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
