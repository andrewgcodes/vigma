"use client";

import React, { useRef, useState } from "react";
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
  Hexagon,
  Keyboard,
  X,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { ToolType } from "@/types";

interface ToolbarProps {
  onExportPNG: (scale?: number) => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onImportSVG: (file: File) => void;
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

function KeyboardShortcutsDialog({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { category: "Tools", items: [
      { key: "V", action: "Select" },
      { key: "H", action: "Hand/Pan" },
      { key: "R", action: "Rectangle" },
      { key: "O", action: "Ellipse" },
      { key: "L", action: "Line" },
      { key: "A", action: "Arrow" },
      { key: "S", action: "Star" },
      { key: "N", action: "Polygon" },
      { key: "T", action: "Text" },
      { key: "P", action: "Pen" },
    ]},
    { category: "Edit", items: [
      { key: "Ctrl+C", action: "Copy" },
      { key: "Ctrl+X", action: "Cut" },
      { key: "Ctrl+V", action: "Paste" },
      { key: "Ctrl+D", action: "Duplicate" },
      { key: "Ctrl+A", action: "Select All" },
      { key: "Ctrl+Z", action: "Undo" },
      { key: "Ctrl+Shift+Z", action: "Redo" },
      { key: "Delete", action: "Delete" },
    ]},
    { category: "Arrange", items: [
      { key: "Ctrl+G", action: "Group" },
      { key: "Ctrl+Shift+G", action: "Ungroup" },
      { key: "Ctrl+]", action: "Bring Forward" },
      { key: "Ctrl+[", action: "Send Backward" },
      { key: "Ctrl+Shift+]", action: "Bring to Front" },
      { key: "Ctrl+Shift+[", action: "Send to Back" },
    ]},
    { category: "View", items: [
      { key: "Ctrl+0", action: "Reset Zoom" },
      { key: "Ctrl++", action: "Zoom In" },
      { key: "Ctrl+-", action: "Zoom Out" },
      { key: "Space+Drag", action: "Pan Canvas" },
      { key: "Scroll", action: "Zoom" },
    ]},
    { category: "Move", items: [
      { key: "Arrow Keys", action: "Nudge 1px" },
      { key: "Shift+Arrow", action: "Nudge 10px" },
    ]},
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          padding: "24px 28px",
          maxWidth: 520,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", margin: 0 }}>Keyboard Shortcuts</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6e6e73" }}>
            <X size={18} />
          </button>
        </div>
        {shortcuts.map((cat) => (
          <div key={cat.category} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6e6e73", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              {cat.category}
            </div>
            {cat.items.map((item) => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: "#1d1d1f" }}>{item.action}</span>
                <kbd style={{
                  background: "#f5f5f7",
                  border: "1px solid #e5e5e7",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontFamily: "Inter, sans-serif",
                  color: "#6e6e73",
                  fontWeight: 500,
                }}>{item.key}</kbd>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Toolbar({
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onImportJSON,
  onImportSVG,
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
  const svgInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const tools: { tool: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { tool: "select", icon: <MousePointer2 size={18} />, label: "Select", shortcut: "V" },
    { tool: "hand", icon: <Hand size={18} />, label: "Pan", shortcut: "H" },
    { tool: "rectangle", icon: <Square size={18} />, label: "Rectangle", shortcut: "R" },
    { tool: "ellipse", icon: <Circle size={18} />, label: "Ellipse", shortcut: "O" },
    { tool: "triangle", icon: <Triangle size={18} />, label: "Triangle", shortcut: "" },
    { tool: "line", icon: <Minus size={18} />, label: "Line", shortcut: "L" },
    { tool: "arrow", icon: <ArrowRight size={18} />, label: "Arrow", shortcut: "A" },
    { tool: "star", icon: <Star size={18} />, label: "Star", shortcut: "S" },
    { tool: "polygon", icon: <Hexagon size={18} />, label: "Polygon", shortcut: "N" },
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

  const handleSVGImport = () => {
    svgInputRef.current?.click();
  };

  const handleSVGFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportSVG(file);
    }
    e.target.value = "";
  };

  return (
    <>
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
          icon={<Undo2 size={18} style={{ opacity: canUndo ? 1 : 0.4 }} />}
          label="Undo"
          shortcut="Ctrl+Z"
          onClick={onUndo}
        />
        <ToolButton
          icon={<Redo2 size={18} style={{ opacity: canRedo ? 1 : 0.4 }} />}
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

        {/* Keyboard shortcuts */}
        <ToolButton
          icon={<Keyboard size={18} />}
          label="Keyboard Shortcuts"
          shortcut="?"
          onClick={() => setShowShortcuts(true)}
        />

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
                minWidth: 180,
                zIndex: 100,
              }}
              className="animate-fade"
            >
              <ExportMenuItem
                icon={<FileImage size={15} />}
                label="Export PNG (1x)"
                onClick={() => { onExportPNG(1); setShowExportMenu(false); }}
              />
              <ExportMenuItem
                icon={<FileImage size={15} />}
                label="Export PNG (2x)"
                onClick={() => { onExportPNG(2); setShowExportMenu(false); }}
              />
              <ExportMenuItem
                icon={<FileImage size={15} />}
                label="Export PNG (3x)"
                onClick={() => { onExportPNG(3); setShowExportMenu(false); }}
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
              <ExportMenuItem
                icon={<FileCode2 size={15} />}
                label="Import SVG"
                onClick={() => { handleSVGImport(); setShowExportMenu(false); }}
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
        <input
          ref={svgInputRef}
          type="file"
          accept=".svg"
          onChange={handleSVGFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Keyboard shortcuts dialog */}
      {showShortcuts && <KeyboardShortcutsDialog onClose={() => setShowShortcuts(false)} />}
    </>
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
