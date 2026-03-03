"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Layers,
  Square,
  Circle,
  Triangle,
  Minus,
  Type,
  Pencil,
  ImageIcon,
  Star,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { LayerInfo } from "@/types";

interface LayersPanelProps {
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
}

function getLayerIcon(type: string) {
  const size = 14;
  const color = "#a1a1a6";
  switch (type) {
    case "rect":
      return <Square size={size} color={color} />;
    case "circle":
    case "ellipse":
      return <Circle size={size} color={color} />;
    case "triangle":
      return <Triangle size={size} color={color} />;
    case "line":
    case "polyline":
      return <Minus size={size} color={color} />;
    case "textbox":
    case "i-text":
      return <Type size={size} color={color} />;
    case "path":
      return <Pencil size={size} color={color} />;
    case "image":
      return <ImageIcon size={size} color={color} />;
    case "polygon":
      return <Star size={size} color={color} />;
    default:
      return <Square size={size} color={color} />;
  }
}

export default function LayersPanel({
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onRenameLayer,
}: LayersPanelProps) {
  const { layers, selectedObjectId } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleDoubleClick = (layer: LayerInfo) => {
    setEditingId(layer.id);
    setEditValue(layer.name);
  };

  const handleRenameSubmit = (id: string) => {
    if (editValue.trim()) {
      onRenameLayer(id, editValue.trim());
    }
    setEditingId(null);
  };

  // Reverse layers so topmost is first
  const displayLayers = [...layers].reverse();

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        top: 64,
        bottom: 12,
        width: 240,
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: 14,
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 40,
      }}
      className="animate-slide-left"
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid #f0f0f2",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Layers size={15} color="#6e6e73" />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#6e6e73",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Layers
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "#a1a1a6",
            fontWeight: 500,
          }}
        >
          {layers.length}
        </span>
      </div>

      {/* Layer list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 6px",
        }}
      >
        {displayLayers.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "#a1a1a6",
              fontSize: 12,
            }}
          >
            No layers yet.
            <br />
            <span style={{ fontSize: 11 }}>Add shapes to get started.</span>
          </div>
        ) : (
          displayLayers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background:
                  selectedObjectId === layer.id
                    ? "#e8f4fd"
                    : "transparent",
                opacity: layer.visible ? 1 : 0.45,
                transition: "all 0.12s ease",
                marginBottom: 1,
              }}
              onMouseEnter={(e) => {
                if (selectedObjectId !== layer.id)
                  e.currentTarget.style.background = "#f5f5f7";
              }}
              onMouseLeave={(e) => {
                if (selectedObjectId !== layer.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Icon */}
              {getLayerIcon(layer.type)}

              {/* Name */}
              {editingId === layer.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(layer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(layer.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    border: "1px solid #0071e3",
                    borderRadius: 4,
                    padding: "2px 6px",
                    outline: "none",
                    fontFamily: "Inter, sans-serif",
                    background: "white",
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => handleDoubleClick(layer)}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: selectedObjectId === layer.id ? "#0071e3" : "#1d1d1f",
                    fontWeight: selectedObjectId === layer.id ? 500 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {layer.name}
                </span>
              )}

              {/* Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  opacity: 0.5,
                }}
                className="layer-controls"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    color: "#6e6e73",
                  }}
                >
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    color: "#6e6e73",
                  }}
                >
                  {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer actions */}
      {selectedObjectId && (
        <div
          style={{
            padding: "8px 10px",
            borderTop: "1px solid #f0f0f2",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <button
            onClick={() => onMoveUp(selectedObjectId)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "6px",
              border: "none",
              background: "#f5f5f7",
              borderRadius: 6,
              cursor: "pointer",
              color: "#6e6e73",
              fontSize: 11,
            }}
          >
            <ChevronUp size={13} /> Up
          </button>
          <button
            onClick={() => onMoveDown(selectedObjectId)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "6px",
              border: "none",
              background: "#f5f5f7",
              borderRadius: 6,
              cursor: "pointer",
              color: "#6e6e73",
              fontSize: 11,
            }}
          >
            <ChevronDown size={13} /> Down
          </button>
          <button
            onClick={() => onDeleteLayer(selectedObjectId)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 10px",
              border: "none",
              background: "#fff0f0",
              borderRadius: 6,
              cursor: "pointer",
              color: "#ff3b30",
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
