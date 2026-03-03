"use client";

import React, { useRef, useCallback } from "react";
import * as fabric from "fabric";
import DesignCanvas from "@/components/DesignCanvas";
import Toolbar from "@/components/Toolbar";
import LayersPanel from "@/components/LayersPanel";
import PropertiesPanel from "@/components/PropertiesPanel";
import ContextMenu from "@/components/ContextMenu";
import { CanvasHistory } from "@/lib/canvasHistory";
import { useStore } from "@/store/useStore";
import {
  addImageToCanvas,
  exportCanvasAsPNG,
  exportCanvasAsSVG,
  exportCanvasAsJSON,
  loadCanvasFromJSON,
  importSVGToCanvas,
} from "@/lib/fabricUtils";

export default function Home() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef<CanvasHistory>(new CanvasHistory());

  const {
    selectedObjectId,
    setSelectedObjectId,
    setCanUndo,
    setCanRedo,
    setLayers,
    setZoom,
    zoom,
    clipboardData,
    setClipboardData,
  } = useStore();

  // Get selected object properties
  const getSelectedObjectProps = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObjectId) return null;

    const obj = canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === selectedObjectId
    );
    if (!obj) return null;

    const shadow = obj.shadow as fabric.Shadow | null;
    return {
      type: obj.type || "object",
      left: obj.left || 0,
      top: obj.top || 0,
      width: obj.width || 0,
      height: obj.height || 0,
      angle: obj.angle || 0,
      fill: (typeof obj.fill === "string" ? obj.fill : "#000000") || "#000000",
      stroke: (obj.stroke as string) || "",
      strokeWidth: obj.strokeWidth || 0,
      strokeDashArray: obj.strokeDashArray || null,
      opacity: obj.opacity ?? 1,
      rx: (obj as fabric.Rect).rx,
      ry: (obj as fabric.Rect).ry,
      fontFamily: (obj as fabric.Textbox).fontFamily,
      fontSize: (obj as fabric.Textbox).fontSize,
      fontWeight: (obj as fabric.Textbox).fontWeight as string,
      fontStyle: (obj as fabric.Textbox).fontStyle,
      textAlign: (obj as fabric.Textbox).textAlign,
      underline: (obj as fabric.Textbox).underline,
      linethrough: (obj as fabric.Textbox).linethrough,
      charSpacing: (obj as fabric.Textbox).charSpacing,
      lineHeight: (obj as fabric.Textbox).lineHeight,
      text: (obj as fabric.Textbox).text,
      scaleX: obj.scaleX ?? 1,
      scaleY: obj.scaleY ?? 1,
      shadow: shadow ? {
        color: shadow.color || "#000000",
        blur: shadow.blur || 0,
        offsetX: shadow.offsetX || 0,
        offsetY: shadow.offsetY || 0,
      } : null,
      flipX: obj.flipX,
      flipY: obj.flipY,
      globalCompositeOperation: obj.globalCompositeOperation,
    };
  }, [selectedObjectId]);

  const selectedObjectProps = getSelectedObjectProps();

  // Property change handler
  const handlePropertyChange = useCallback(
    (property: string, value: number | string | boolean | number[]) => {
      const canvas = canvasRef.current;
      if (!canvas || !selectedObjectId) return;

      const obj = canvas.getObjects().find(
        (o) => (o as fabric.FabricObject & { id?: string }).id === selectedObjectId
      );
      if (!obj) return;

      switch (property) {
        case "left":
          obj.set("left", value as number);
          break;
        case "top":
          obj.set("top", value as number);
          break;
        case "width": {
          const newWidth = value as number;
          obj.set("scaleX", newWidth / (obj.width || 1));
          break;
        }
        case "height": {
          const newHeight = value as number;
          obj.set("scaleY", newHeight / (obj.height || 1));
          break;
        }
        case "angle":
          obj.set("angle", value as number);
          break;
        case "fill":
          obj.set("fill", value as string);
          break;
        case "stroke":
          obj.set("stroke", value as string);
          break;
        case "strokeWidth":
          obj.set("strokeWidth", value as number);
          break;
        case "strokeDashArray": {
          const arr = value as number[];
          obj.set("strokeDashArray", arr.length > 0 ? arr : undefined);
          break;
        }
        case "opacity":
          obj.set("opacity", value as number);
          break;
        case "cornerRadius":
          (obj as fabric.Rect).set("rx", value as number);
          (obj as fabric.Rect).set("ry", value as number);
          break;
        case "fontFamily":
          (obj as fabric.Textbox).set("fontFamily", value as string);
          break;
        case "fontSize":
          (obj as fabric.Textbox).set("fontSize", value as number);
          break;
        case "fontWeight":
          (obj as fabric.Textbox).set("fontWeight", value as string);
          break;
        case "fontStyle":
          (obj as fabric.Textbox).set("fontStyle", value as string);
          break;
        case "textAlign":
          (obj as fabric.Textbox).set("textAlign", value as string);
          break;
        case "underline":
          (obj as fabric.Textbox).set("underline", value as boolean);
          break;
        case "linethrough":
          (obj as fabric.Textbox).set("linethrough", value as boolean);
          break;
        case "charSpacing":
          (obj as fabric.Textbox).set("charSpacing", value as number);
          break;
        case "lineHeight":
          (obj as fabric.Textbox).set("lineHeight", value as number);
          break;
        case "globalCompositeOperation":
          obj.set("globalCompositeOperation", value as GlobalCompositeOperation);
          break;
        case "flipX":
          obj.set("flipX", value as boolean);
          break;
        case "flipY":
          obj.set("flipY", value as boolean);
          break;
        case "shadowEnabled": {
          if (value) {
            obj.set("shadow", new fabric.Shadow({ color: "rgba(0,0,0,0.3)", blur: 10, offsetX: 4, offsetY: 4 }));
          } else {
            obj.set("shadow", null);
          }
          break;
        }
        case "shadowColor": {
          const s = obj.shadow as fabric.Shadow;
          if (s) s.color = value as string;
          break;
        }
        case "shadowBlur": {
          const s = obj.shadow as fabric.Shadow;
          if (s) s.blur = value as number;
          break;
        }
        case "shadowOffsetX": {
          const s = obj.shadow as fabric.Shadow;
          if (s) s.offsetX = value as number;
          break;
        }
        case "shadowOffsetY": {
          const s = obj.shadow as fabric.Shadow;
          if (s) s.offsetY = value as number;
          break;
        }
        case "gradient": {
          const gradientType = value as string;
          const currentFill = typeof obj.fill === "string" ? obj.fill : "#007aff";
          if (gradientType === "linear") {
            const gradient = new fabric.Gradient({
              type: "linear",
              coords: { x1: 0, y1: 0, x2: obj.width || 200, y2: obj.height || 150 },
              colorStops: [
                { offset: 0, color: currentFill },
                { offset: 1, color: "#ff2d55" },
              ],
            });
            obj.set("fill", gradient);
          } else if (gradientType === "radial") {
            const w = obj.width || 200;
            const h = obj.height || 150;
            const gradient = new fabric.Gradient({
              type: "radial",
              coords: { x1: w / 2, y1: h / 2, x2: w / 2, y2: h / 2, r1: 0, r2: Math.max(w, h) / 2 },
              colorStops: [
                { offset: 0, color: currentFill },
                { offset: 1, color: "#5856d6" },
              ],
            });
            obj.set("fill", gradient);
          }
          break;
        }
      }

      obj.setCoords();
      canvas.renderAll();

      historyRef.current.saveState(canvas);
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
    },
    [selectedObjectId, setCanUndo, setCanRedo]
  );

  // Alignment handler for multiple selection
  const handleAlignObjects = useCallback((alignment: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== "activeselection") return;
    const sel = activeObj as fabric.ActiveSelection;
    const objects = sel.getObjects();
    if (objects.length < 2) return;

    const bounds = sel.getBoundingRect();

    objects.forEach((obj) => {
      const objBounds = obj.getBoundingRect();
      switch (alignment) {
        case "left":
          obj.set("left", (obj.left || 0) + (bounds.left - objBounds.left));
          break;
        case "right":
          obj.set("left", (obj.left || 0) + (bounds.left + bounds.width - objBounds.left - objBounds.width));
          break;
        case "centerH":
          obj.set("left", (obj.left || 0) + (bounds.left + bounds.width / 2 - objBounds.left - objBounds.width / 2));
          break;
        case "top":
          obj.set("top", (obj.top || 0) + (bounds.top - objBounds.top));
          break;
        case "bottom":
          obj.set("top", (obj.top || 0) + (bounds.top + bounds.height - objBounds.top - objBounds.height));
          break;
        case "centerV":
          obj.set("top", (obj.top || 0) + (bounds.top + bounds.height / 2 - objBounds.top - objBounds.height / 2));
          break;
      }
      obj.setCoords();
    });

    canvas.renderAll();
    historyRef.current.saveState(canvas);
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, [setCanUndo, setCanRedo]);

  // Context menu handlers
  const handleContextCopy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.clone().then((cloned: fabric.FabricObject) => {
        const json = JSON.stringify(cloned.toJSON());
        setClipboardData(json);
      });
    }
  }, [setClipboardData]);

  const handleContextCut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.clone().then((cloned: fabric.FabricObject) => {
        const json = JSON.stringify(cloned.toJSON());
        setClipboardData(json);
        const activeObjs = canvas.getActiveObjects();
        activeObjs.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
        historyRef.current.saveState(canvas);
        setCanUndo(historyRef.current.canUndo);
        setCanRedo(historyRef.current.canRedo);
        setSelectedObjectId(null);
      });
    }
  }, [setClipboardData, setSelectedObjectId, setCanUndo, setCanRedo]);

  const handleContextPaste = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !clipboardData) return;
    try {
      const parsed = JSON.parse(clipboardData);
      fabric.util.enlivenObjects([parsed]).then((enlivened) => {
        const objects = enlivened as fabric.FabricObject[];
        if (objects.length > 0) {
          const obj = objects[0];
          obj.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
          const o = obj as fabric.FabricObject & { id?: string; name?: string };
          o.id = `obj_${Date.now()}_paste`;
          o.name = (o.name || "Object") + " Copy";
          canvas.add(obj);
          canvas.setActiveObject(obj);
          canvas.renderAll();
          historyRef.current.saveState(canvas);
          setCanUndo(historyRef.current.canUndo);
          setCanRedo(historyRef.current.canRedo);
        }
      });
    } catch { /* ignore */ }
  }, [clipboardData, setCanUndo, setCanRedo]);

  const handleContextDuplicate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.clone().then((cloned: fabric.FabricObject) => {
        cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
        const c = cloned as fabric.FabricObject & { id?: string; name?: string };
        c.id = `obj_${Date.now()}_clone`;
        c.name = `${(activeObj as fabric.FabricObject & { name?: string }).name || "Object"} Copy`;
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        historyRef.current.saveState(canvas);
        setCanUndo(historyRef.current.canUndo);
        setCanRedo(historyRef.current.canRedo);
      });
    }
  }, [setCanUndo, setCanRedo]);

  const handleContextDelete = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    historyRef.current.saveState(canvas);
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
    setSelectedObjectId(null);
  }, [setSelectedObjectId, setCanUndo, setCanRedo]);

  const handleContextGroup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
        historyRef.current.saveState(canvas);
        setCanUndo(historyRef.current.canUndo);
        setCanRedo(historyRef.current.canRedo);
        syncLayers(canvas);
      }
    }
  }, [setCanUndo, setCanRedo]);

  const handleContextUngroup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === "group") {
      const group = activeObj as fabric.Group;
      const items = [...group.getObjects()];
      group.removeAll();
      canvas.remove(group);
      const sel: fabric.FabricObject[] = [];
      items.forEach((item) => { canvas.add(item); sel.push(item); });
      const activeSelection = new fabric.ActiveSelection(sel, { canvas });
      canvas.setActiveObject(activeSelection);
      canvas.renderAll();
      historyRef.current.saveState(canvas);
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
      syncLayers(canvas);
    }
  }, [setCanUndo, setCanRedo]);

  const handleContextBringForward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
  }, []);

  const handleContextSendBackward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
  }, []);

  const handleContextBringToFront = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.moveObjectTo(obj, canvas.getObjects().length - 1);
      canvas.renderAll();
      syncLayers(canvas);
    }
  }, []);

  const handleContextSendToBack = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.moveObjectTo(obj, 0);
      canvas.renderAll();
      syncLayers(canvas);
    }
  }, []);

  // Determine context menu state
  const getContextMenuState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { hasSelection: false, hasMultipleSelection: false, isGroup: false };
    const activeObj = canvas.getActiveObject();
    return {
      hasSelection: !!activeObj,
      hasMultipleSelection: activeObj?.type === "activeselection",
      isGroup: activeObj?.type === "group",
    };
  }, []);

  // Layer actions
  const handleSelectLayer = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find(
        (o) => (o as fabric.FabricObject & { id?: string }).id === id
      );
      if (obj) {
        canvas.setActiveObject(obj);
        canvas.renderAll();
        setSelectedObjectId(id);
      }
    },
    [setSelectedObjectId]
  );

  const handleDeleteLayer = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find(
        (o) => (o as fabric.FabricObject & { id?: string }).id === id
      );
      if (obj) {
        canvas.remove(obj);
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObjectId(null);
        historyRef.current.saveState(canvas);
        setCanUndo(historyRef.current.canUndo);
        setCanRedo(historyRef.current.canRedo);
      }
    },
    [setSelectedObjectId, setCanUndo, setCanRedo]
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find(
        (o) => (o as fabric.FabricObject & { id?: string }).id === id
      );
      if (obj) {
        obj.visible = !obj.visible;
        canvas.renderAll();
        syncLayers(canvas);
      }
    },
    []
  );

  const handleToggleLock = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find(
        (o) => (o as fabric.FabricObject & { id?: string }).id === id
      );
      if (obj) {
        obj.selectable = !obj.selectable;
        obj.evented = obj.selectable;
        (obj as fabric.FabricObject & { locked?: boolean }).locked = !obj.selectable;
        canvas.renderAll();
        syncLayers(canvas);
      }
    },
    []
  );

  const handleMoveUp = useCallback((id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const idx = objects.findIndex(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (idx < objects.length - 1) {
      const obj = objects[idx];
      canvas.moveObjectTo(obj, idx + 1);
      canvas.renderAll();
      syncLayers(canvas);
    }
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const idx = objects.findIndex(
      (o) => (o as fabric.FabricObject & { id?: string }).id === id
    );
    if (idx > 0) {
      const obj = objects[idx];
      canvas.moveObjectTo(obj, idx - 1);
      canvas.renderAll();
      syncLayers(canvas);
    }
  }, []);

  const handleRenameLayer = useCallback(
    (id: string, name: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find(
        (o) => (o as fabric.FabricObject & { id?: string }).id === id
      );
      if (obj) {
        (obj as fabric.FabricObject & { name?: string }).name = name;
        syncLayers(canvas);
      }
    },
    []
  );

  const syncLayers = (canvas: fabric.Canvas) => {
    const objects = canvas.getObjects();
    const layerInfos = objects.map((obj) => {
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
  };

  // Export handlers
  const handleExportPNG = useCallback((scale?: number) => {
    if (canvasRef.current) exportCanvasAsPNG(canvasRef.current, "design.png", scale || 2);
  }, []);

  const handleExportSVG = useCallback(() => {
    if (canvasRef.current) exportCanvasAsSVG(canvasRef.current);
  }, []);

  const handleExportJSON = useCallback(() => {
    if (canvasRef.current) exportCanvasAsJSON(canvasRef.current);
  }, []);

  const handleImportJSON = useCallback(
    async (file: File) => {
      if (canvasRef.current) {
        await loadCanvasFromJSON(canvasRef.current, file);
        syncLayers(canvasRef.current);
        historyRef.current.saveState(canvasRef.current);
        setCanUndo(historyRef.current.canUndo);
        setCanRedo(historyRef.current.canRedo);
      }
    },
    [setCanUndo, setCanRedo]
  );

  const handleImportSVG = useCallback(
    async (file: File) => {
      if (canvasRef.current) {
        await importSVGToCanvas(canvasRef.current, file);
        syncLayers(canvasRef.current);
        historyRef.current.saveState(canvasRef.current);
        setCanUndo(historyRef.current.canUndo);
        setCanRedo(historyRef.current.canRedo);
      }
    },
    [setCanUndo, setCanRedo]
  );

  const handleUploadImage = useCallback(
    async (file: File) => {
      if (canvasRef.current) {
        await addImageToCanvas(canvasRef.current, file);
        historyRef.current.saveState(canvasRef.current);
        setCanUndo(historyRef.current.canUndo);
        setCanRedo(historyRef.current.canRedo);
      }
    },
    [setCanUndo, setCanRedo]
  );

  // Undo/Redo
  const handleUndo = useCallback(async () => {
    if (canvasRef.current && await historyRef.current.undo(canvasRef.current)) {
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
      syncLayers(canvasRef.current);
    }
  }, [setCanUndo, setCanRedo]);

  const handleRedo = useCallback(async () => {
    if (canvasRef.current && await historyRef.current.redo(canvasRef.current)) {
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
      syncLayers(canvasRef.current);
    }
  }, [setCanUndo, setCanRedo]);

  // Zoom
  const handleZoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newZoom = Math.min((zoom + 10) / 100, 5);
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(center, newZoom);
    setZoom(Math.round(newZoom * 100));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newZoom = Math.max((zoom - 10) / 100, 0.1);
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(center, newZoom);
    setZoom(Math.round(newZoom * 100));
  }, [zoom, setZoom]);

  const handleZoomReset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(100);
  }, [setZoom]);

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Canvas */}
      <DesignCanvas canvasRef={canvasRef} historyRef={historyRef} />

      {/* Toolbar */}
      <Toolbar
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onImportSVG={handleImportSVG}
        onUploadImage={handleUploadImage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      {/* Layers Panel */}
      <LayersPanel
        onSelectLayer={handleSelectLayer}
        onDeleteLayer={handleDeleteLayer}
        onToggleVisibility={handleToggleVisibility}
        onToggleLock={handleToggleLock}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onRenameLayer={handleRenameLayer}
      />

      {/* Properties Panel */}
      <PropertiesPanel
        selectedObject={selectedObjectProps}
        onPropertyChange={handlePropertyChange}
        onAlignObjects={handleAlignObjects}
        hasMultipleSelection={canvasRef.current?.getActiveObject()?.type === "activeselection"}
      />

      {/* Context Menu */}
      {(() => {
        const state = getContextMenuState();
        return (
          <ContextMenu
            onCopy={handleContextCopy}
            onCut={handleContextCut}
            onPaste={handleContextPaste}
            onDuplicate={handleContextDuplicate}
            onDelete={handleContextDelete}
            onGroup={handleContextGroup}
            onUngroup={handleContextUngroup}
            onBringForward={handleContextBringForward}
            onSendBackward={handleContextSendBackward}
            onBringToFront={handleContextBringToFront}
            onSendToBack={handleContextSendToBack}
            hasSelection={state.hasSelection}
            hasMultipleSelection={state.hasMultipleSelection}
            isGroup={state.isGroup}
            hasClipboard={!!clipboardData}
          />
        );
      })()}

      {/* Logo */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          borderRadius: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          zIndex: 30,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: "linear-gradient(135deg, #0071e3, #5856d6)",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6e6e73",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Vigma
        </span>
      </div>
    </main>
  );
}
