"use client";

import React, { useRef, useCallback } from "react";
import * as fabric from "fabric";
import DesignCanvas from "@/components/DesignCanvas";
import Toolbar from "@/components/Toolbar";
import LayersPanel from "@/components/LayersPanel";
import PropertiesPanel from "@/components/PropertiesPanel";
import { CanvasHistory } from "@/lib/canvasHistory";
import { useStore } from "@/store/useStore";
import {
  addImageToCanvas,
  exportCanvasAsPNG,
  exportCanvasAsSVG,
  exportCanvasAsJSON,
  loadCanvasFromJSON,
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
  } = useStore();

  // Get selected object properties
  const getSelectedObjectProps = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObjectId) return null;

    const obj = canvas.getObjects().find(
      (o) => (o as fabric.FabricObject & { id?: string }).id === selectedObjectId
    );
    if (!obj) return null;

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
      opacity: obj.opacity ?? 1,
      rx: (obj as fabric.Rect).rx,
      ry: (obj as fabric.Rect).ry,
      fontFamily: (obj as fabric.Textbox).fontFamily,
      fontSize: (obj as fabric.Textbox).fontSize,
      fontWeight: (obj as fabric.Textbox).fontWeight as string,
      text: (obj as fabric.Textbox).text,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
    };
  }, [selectedObjectId]);

  const selectedObjectProps = getSelectedObjectProps();

  // Property change handler
  const handlePropertyChange = useCallback(
    (property: string, value: number | string) => {
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
      }

      obj.setCoords();
      canvas.renderAll();

      // Save history
      historyRef.current.saveState(canvas);
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
    },
    [selectedObjectId, setCanUndo, setCanRedo]
  );

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
  const handleExportPNG = useCallback(() => {
    if (canvasRef.current) exportCanvasAsPNG(canvasRef.current);
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
      />

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
