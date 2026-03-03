"use client";

import React, { useRef } from "react";
import {
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  Star,
  Type,
  Pencil,
  ImagePlus,
  Hand,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  Upload,
  FileJson,
  FileImage,
  FileCode2,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { ToolType } from "@/types";

interface ToolbarProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onUploadImage: (file: File) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  shortcut?: string;
}

function ToolButton({ icon, label, active, onClick, shortcut }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className="tooltip"
      data-tooltip={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 8,
        border: "none",
        background: active ? "#0071e3" : "transparent",
        color: active ? "white" : "#6e6e73",
        cursor: "pointer",
        transition: "all 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#f0f0f2";
          e.currentTarget.style.color = "#1d1d1f";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#6e6e73";
        }
      }}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: "#e5e5e7",
        margin: "0 4px",
      }}
    />
  );
}

export default function Toolbar({
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onImportJSON,
  onUploadImage,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: ToolbarProps) {
  const { activeTool, setActiveTool, zoom, canUndo, canRedo } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const tools: { tool: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { tool: "select", icon: <MousePointer2 size={18} />, label: "Select", shortcut: "V" },
    { tool: "hand", icon: <Hand size={18} />, label: "Pan", shortcut: "H" },
    { tool: "rectangle", icon: <Square size={18} />, label: "Rectangle", shortcut: "R" },
    { tool: "ellipse", icon: <Circle size={18} />, label: "Ellipse", shortcut: "O" },
    { tool: "triangle", icon: <Triangle size={18} />, label: "Triangle", shortcut: "T" },
    { tool: "line", icon: <Minus size={18} />, label: "Line", shortcut: "L" },
    { tool: "arrow", icon: <ArrowRight size={18} />, label: "Arrow", shortcut: "A" },
    { tool: "star", icon: <Star size={18} />, label: "Star", shortcut: "S" },
    { tool: "text", icon: <Type size={18} />, label: "Text", shortcut: "T" },
    { tool: "pen", icon: <Pencil size={18} />, label: "Pen", shortcut: "P" },
  ];

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      setActiveTool("select");
    }
    e.target.value = "";
  };

  const handleJSONImport = () => {
    jsonInputRef.current?.click();
  };

  const handleJSONFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
    e.target.value = "";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "6px 10px",
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.05)",
        zIndex: 50,
      }}
      className="animate-fade"
    >
      {/* Drawing tools */}
      {tools.map((t) => (
        <ToolButton
          key={t.tool}
          icon={t.icon}
          label={t.label}
          shortcut={t.shortcut}
          active={activeTool === t.tool}
          onClick={() => setActiveTool(t.tool)}
        />
      ))}

      <Divider />

      {/* Image upload */}
      <ToolButton
        icon={<ImagePlus size={18} />}
        label="Upload Image"
        onClick={handleImageUpload}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        style={{ display: "none" }}
      />

      <Divider />

      {/* Undo/Redo */}
      <ToolButton
        icon={<Undo2 size={18} />}
        label="Undo"
        shortcut="Ctrl+Z"
        onClick={onUndo}
      />
      <ToolButton
        icon={<Redo2 size={18} />}
        label="Redo"
        shortcut="Ctrl+Shift+Z"
        onClick={onRedo}
      />

      <Divider />

      {/* Zoom controls */}
      <ToolButton icon={<ZoomOut size={18} />} label="Zoom Out" onClick={onZoomOut} />
      <button
        onClick={onZoomReset}
        className="tooltip"
        data-tooltip="Reset Zoom"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 48,
          height: 36,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "#6e6e73",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {Math.round(zoom)}%
      </button>
      <ToolButton icon={<ZoomIn size={18} />} label="Zoom In" onClick={onZoomIn} />

      <Divider />

      {/* Export */}
      <div style={{ position: "relative" }}>
        <ToolButton
          icon={<Download size={18} />}
          label="Export"
          onClick={() => setShowExportMenu(!showExportMenu)}
        />
        {showExportMenu && (
          <div
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: 10,
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.05)",
              padding: 4,
              minWidth: 160,
              zIndex: 100,
            }}
            className="animate-fade"
          >
            <ExportMenuItem
              icon={<FileImage size={15} />}
              label="Export PNG"
              onClick={() => { onExportPNG(); setShowExportMenu(false); }}
            />
            <ExportMenuItem
              icon={<FileCode2 size={15} />}
              label="Export SVG"
              onClick={() => { onExportSVG(); setShowExportMenu(false); }}
            />
            <ExportMenuItem
              icon={<FileJson size={15} />}
              label="Save JSON"
              onClick={() => { onExportJSON(); setShowExportMenu(false); }}
            />
            <div style={{ height: 1, background: "#e5e5e7", margin: "4px 8px" }} />
            <ExportMenuItem
              icon={<Upload size={15} />}
              label="Load JSON"
              onClick={() => { handleJSONImport(); setShowExportMenu(false); }}
            />
          </div>
        )}
      </div>
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        onChange={handleJSONFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

function ExportMenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "8px 12px",
        border: "none",
        background: "transparent",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
        color: "#1d1d1f",
        fontFamily: "Inter, sans-serif",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f0f0f2";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: "#6e6e73" }}>{icon}</span>
      {label}
    </button>
  );
}
