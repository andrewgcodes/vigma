"use client";

import React, { useState } from "react";
import {
  Settings2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  FlipHorizontal2,
  FlipVertical2,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Lock,
  Unlock,
} from "lucide-react";
import { useStore } from "@/store/useStore";

interface PropertiesPanelProps {
  selectedObject: {
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    angle: number;
    fill: string | object | null;
    stroke: string;
    strokeWidth: number;
    strokeDashArray?: number[] | null;
    opacity: number;
    rx?: number;
    ry?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: string;
    underline?: boolean;
    linethrough?: boolean;
    charSpacing?: number;
    lineHeight?: number;
    text?: string;
    scaleX: number;
    scaleY: number;
    shadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
    flipX?: boolean;
    flipY?: boolean;
    globalCompositeOperation?: string;
  } | null;
  onPropertyChange: (property: string, value: number | string | boolean | number[], options?: { skipHistory?: boolean }) => void;
  onAlignObjects?: (alignment: string) => void;
  hasMultipleSelection?: boolean;
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 0",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#6e6e73",
          fontWeight: 500,
          minWidth: 28,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  width,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
}) {
  const [localValue, setLocalValue] = useState(String(Math.round(value * 100) / 100));
  const [isFocused, setIsFocused] = useState(false);

  // Sync local value with prop when not focused (external changes)
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(Math.round(value * 100) / 100));
    }
  }, [value, isFocused]);

  const commit = (val: string) => {
    const num = parseFloat(val) || 0;
    if (num !== value) {
      onChange(num);
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      min={min}
      max={max}
      step={step || 1}
      style={{
        width: width || 64,
        height: 28,
        border: "1px solid #e5e5e7",
        borderRadius: 6,
        padding: "0 8px",
        fontSize: 12,
        color: "#1d1d1f",
        fontFamily: "Inter, sans-serif",
        background: "white",
        outline: "none",
        textAlign: "right",
      }}
      onFocus={(e) => {
        setIsFocused(true);
        e.currentTarget.style.borderColor = "#0071e3";
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,113,227,0.15)";
      }}
      onBlur={(e) => {
        setIsFocused(false);
        commit(localValue);
        e.currentTarget.style.borderColor = "#e5e5e7";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        title={label}
        style={{
          width: 24,
          height: 24,
          cursor: "pointer",
          borderRadius: 6,
          border: "1px solid #e5e5e7",
        }}
      />
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        style={{
          width: 72,
          height: 28,
          border: "1px solid #e5e5e7",
          borderRadius: 6,
          padding: "0 8px",
          fontSize: 11,
          color: "#1d1d1f",
          fontFamily: "monospace",
          background: "white",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#0071e3";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e5e5e7";
        }}
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#6e6e73",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        padding: "12px 0 6px",
        borderTop: "1px solid #f0f0f2",
        marginTop: 4,
      }}
    >
      {title}
    </div>
  );
}

const FONT_FAMILIES = [
  "Inter",
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Palatino",
  "Garamond",
];

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "hue", label: "Hue" },
  { value: "saturation", label: "Saturation" },
  { value: "color", label: "Color" },
  { value: "luminosity", label: "Luminosity" },
];

const PRESET_COLORS = [
  "#1d1d1f", "#ffffff", "#ff3b30", "#ff9500", "#ffcc00",
  "#34c759", "#00c7be", "#30b0c7", "#007aff", "#5856d6",
  "#af52de", "#ff2d55", "#8e8e93", "#636366", "#48484a",
];

function SmallButton({
  icon,
  active,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "1px solid " + (active ? "#0071e3" : "#e5e5e7"),
        background: active ? "#e8f4fd" : "white",
        color: active ? "#0071e3" : "#6e6e73",
        cursor: "pointer",
        transition: "all 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#f5f5f7";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "white";
      }}
    >
      {icon}
    </button>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: number;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: width || 120,
        height: 28,
        border: "1px solid #e5e5e7",
        borderRadius: 6,
        padding: "0 6px",
        fontSize: 11,
        color: "#1d1d1f",
        fontFamily: "Inter, sans-serif",
        background: "white",
        outline: "none",
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function PropertiesPanel({
  selectedObject,
  onPropertyChange,
  onAlignObjects,
  hasMultipleSelection,
}: PropertiesPanelProps) {
  const obj = selectedObject;
  const isText = obj?.type === "textbox" || obj?.type === "i-text";
  const isRect = obj?.type === "rect";
  const [lockAspect, setLockAspect] = useState(false);
  const { fillColor, setFillColor, strokeColor, setStrokeColor } = useStore();

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        top: 64,
        bottom: 12,
        width: 252,
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
      className="animate-slide-right"
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
        <Settings2 size={15} color="#6e6e73" />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#6e6e73",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Properties
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 16px 16px",
        }}
      >
        {!obj ? (
          <>
            {/* Default colors when nothing selected */}
            <SectionHeader title="Default Fill" />
            <PropertyRow label="Color">
              <ColorInput
                value={fillColor}
                onChange={(v) => setFillColor(v)}
                label="Fill"
              />
            </PropertyRow>
            {/* Color presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 0" }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setFillColor(c)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: c,
                    border: fillColor === c ? "2px solid #0071e3" : "1px solid #e5e5e7",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title={c}
                />
              ))}
            </div>
            <SectionHeader title="Default Stroke" />
            <PropertyRow label="Color">
              <ColorInput
                value={strokeColor}
                onChange={(v) => setStrokeColor(v)}
                label="Stroke"
              />
            </PropertyRow>
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                color: "#a1a1a6",
                fontSize: 12,
              }}
            >
              Select an object to
              <br />
              edit its properties.
            </div>
          </>
        ) : (
          <>
            {/* Position */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6e6e73", textTransform: "uppercase", letterSpacing: "0.04em", paddingBottom: 6 }}>
              Position
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <PropertyRow label="X">
                <NumberInput
                  value={obj.left}
                  onChange={(v) => onPropertyChange("left", v)}
                />
              </PropertyRow>
              <PropertyRow label="Y">
                <NumberInput
                  value={obj.top}
                  onChange={(v) => onPropertyChange("top", v)}
                />
              </PropertyRow>
            </div>

            {/* Size */}
            <SectionHeader title="Size" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <PropertyRow label="W">
                <NumberInput
                  value={obj.width * obj.scaleX}
                  onChange={(v) => {
                    if (lockAspect) {
                      const ratio = obj.height * obj.scaleY / (obj.width * obj.scaleX || 1);
                      onPropertyChange("width", v, { skipHistory: true });
                      onPropertyChange("height", v * ratio);
                    } else {
                      onPropertyChange("width", v);
                    }
                  }}
                  min={1}
                />
              </PropertyRow>
              <PropertyRow label="H">
                <NumberInput
                  value={obj.height * obj.scaleY}
                  onChange={(v) => {
                    if (lockAspect) {
                      const ratio = obj.width * obj.scaleX / (obj.height * obj.scaleY || 1);
                      onPropertyChange("height", v, { skipHistory: true });
                      onPropertyChange("width", v * ratio);
                    } else {
                      onPropertyChange("height", v);
                    }
                  }}
                  min={1}
                />
              </PropertyRow>
            </div>
            {/* Lock aspect ratio */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
              <SmallButton
                icon={lockAspect ? <Lock size={11} /> : <Unlock size={11} />}
                active={lockAspect}
                onClick={() => setLockAspect(!lockAspect)}
                title="Lock aspect ratio"
              />
              <span style={{ fontSize: 10, color: "#a1a1a6" }}>
                {lockAspect ? "Aspect locked" : "Aspect unlocked"}
              </span>
            </div>

            {/* Rotation */}
            <PropertyRow label="Rotation">
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <NumberInput
                  value={obj.angle}
                  onChange={(v) => onPropertyChange("angle", v)}
                  min={0}
                  max={360}
                />
                <span style={{ fontSize: 11, color: "#a1a1a6" }}>deg</span>
              </div>
            </PropertyRow>

            {/* Fill */}
            <SectionHeader title="Fill" />
            <PropertyRow label="Color">
              <ColorInput
                value={typeof obj.fill === "string" ? obj.fill : "#4A90D9"}
                onChange={(v) => onPropertyChange("fill", v)}
                label="Fill"
              />
            </PropertyRow>
            {typeof obj.fill !== "string" && (
              <div style={{ fontSize: 10, color: "#0071e3", padding: "2px 0" }}>Gradient applied</div>
            )}
            {/* Color presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 0" }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onPropertyChange("fill", c)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    background: c,
                    border: (typeof obj.fill === "string" && obj.fill === c) ? "2px solid #0071e3" : "1px solid #e5e5e7",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title={c}
                />
              ))}
            </div>

            {/* Gradient */}
            <PropertyRow label="Gradient">
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => onPropertyChange("gradient", "linear")}
                  style={{
                    height: 24,
                    padding: "0 8px",
                    borderRadius: 4,
                    border: "1px solid #e5e5e7",
                    background: "linear-gradient(90deg, #007aff, #ff2d55)",
                    cursor: "pointer",
                    fontSize: 10,
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  Linear
                </button>
                <button
                  onClick={() => onPropertyChange("gradient", "radial")}
                  style={{
                    height: 24,
                    padding: "0 8px",
                    borderRadius: 4,
                    border: "1px solid #e5e5e7",
                    background: "radial-gradient(circle, #007aff, #5856d6)",
                    cursor: "pointer",
                    fontSize: 10,
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  Radial
                </button>
                <button
                  onClick={() => onPropertyChange("fill", typeof obj.fill === "string" ? obj.fill : "#4A90D9")}
                  style={{
                    height: 24,
                    padding: "0 8px",
                    borderRadius: 4,
                    border: "1px solid #e5e5e7",
                    background: "white",
                    cursor: "pointer",
                    fontSize: 10,
                    color: "#6e6e73",
                  }}
                >
                  Solid
                </button>
              </div>
            </PropertyRow>

            {/* Stroke */}
            <SectionHeader title="Stroke" />
            <PropertyRow label="Color">
              <ColorInput
                value={obj.stroke === "transparent" ? "#000000" : (obj.stroke || "#000000")}
                onChange={(v) => onPropertyChange("stroke", v)}
                label="Stroke"
              />
            </PropertyRow>
            <PropertyRow label="Width">
              <NumberInput
                value={obj.strokeWidth}
                onChange={(v) => onPropertyChange("strokeWidth", v)}
                min={0}
                max={50}
              />
            </PropertyRow>
            {/* Border style */}
            <PropertyRow label="Style">
              <SelectInput
                value={
                  obj.strokeDashArray && obj.strokeDashArray.length > 0
                    ? obj.strokeDashArray[0] === obj.strokeDashArray[1]
                      ? "dashed"
                      : "dotted"
                    : "solid"
                }
                onChange={(v) => {
                  switch (v) {
                    case "solid":
                      onPropertyChange("strokeDashArray", []);
                      break;
                    case "dashed":
                      onPropertyChange("strokeDashArray", [10, 10]);
                      break;
                    case "dotted":
                      onPropertyChange("strokeDashArray", [3, 6]);
                      break;
                  }
                }}
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "dashed", label: "Dashed" },
                  { value: "dotted", label: "Dotted" },
                ]}
                width={90}
              />
            </PropertyRow>

            {/* Appearance */}
            <SectionHeader title="Appearance" />
            <PropertyRow label="Opacity">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={obj.opacity * 100}
                  onChange={(e) =>
                    onPropertyChange("opacity", parseInt(e.target.value) / 100)
                  }
                  style={{ width: 60 }}
                />
                <span style={{ fontSize: 11, color: "#6e6e73", minWidth: 28, textAlign: "right" }}>
                  {Math.round(obj.opacity * 100)}%
                </span>
              </div>
            </PropertyRow>
            {/* Blend mode */}
            <PropertyRow label="Blend">
              <SelectInput
                value={obj.globalCompositeOperation || "source-over"}
                onChange={(v) => onPropertyChange("globalCompositeOperation", v)}
                options={BLEND_MODES}
                width={110}
              />
            </PropertyRow>

            {/* Corner Radius (rectangles only) */}
            {isRect && (
              <>
                <SectionHeader title="Corners" />
                <PropertyRow label="Radius">
                  <NumberInput
                    value={obj.rx || 0}
                    onChange={(v) => onPropertyChange("cornerRadius", v)}
                    min={0}
                    max={200}
                  />
                </PropertyRow>
              </>
            )}

            {/* Text properties */}
            {isText && (
              <>
                <SectionHeader title="Typography" />
                <PropertyRow label="Font">
                  <select
                    value={obj.fontFamily || "Inter"}
                    onChange={(e) =>
                      onPropertyChange("fontFamily", e.target.value)
                    }
                    style={{
                      width: 120,
                      height: 28,
                      border: "1px solid #e5e5e7",
                      borderRadius: 6,
                      padding: "0 6px",
                      fontSize: 11,
                      color: "#1d1d1f",
                      fontFamily: "Inter, sans-serif",
                      background: "white",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </PropertyRow>
                <PropertyRow label="Size">
                  <NumberInput
                    value={obj.fontSize || 24}
                    onChange={(v) => onPropertyChange("fontSize", v)}
                    min={1}
                    max={400}
                  />
                </PropertyRow>
                <PropertyRow label="Weight">
                  <SelectInput
                    value={obj.fontWeight || "normal"}
                    onChange={(v) => onPropertyChange("fontWeight", v)}
                    options={[
                      { value: "normal", label: "Regular" },
                      { value: "300", label: "Light" },
                      { value: "500", label: "Medium" },
                      { value: "600", label: "Semibold" },
                      { value: "bold", label: "Bold" },
                      { value: "800", label: "Extra Bold" },
                    ]}
                  />
                </PropertyRow>
                {/* Text style buttons */}
                <div style={{ display: "flex", gap: 4, padding: "6px 0" }}>
                  <SmallButton
                    icon={<Bold size={13} />}
                    active={obj.fontWeight === "bold" || obj.fontWeight === "700"}
                    onClick={() => onPropertyChange("fontWeight", obj.fontWeight === "bold" || obj.fontWeight === "700" ? "normal" : "bold")}
                    title="Bold"
                  />
                  <SmallButton
                    icon={<Italic size={13} />}
                    active={obj.fontStyle === "italic"}
                    onClick={() => onPropertyChange("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic")}
                    title="Italic"
                  />
                  <SmallButton
                    icon={<Underline size={13} />}
                    active={obj.underline === true}
                    onClick={() => onPropertyChange("underline", !obj.underline)}
                    title="Underline"
                  />
                  <SmallButton
                    icon={<Strikethrough size={13} />}
                    active={obj.linethrough === true}
                    onClick={() => onPropertyChange("linethrough", !obj.linethrough)}
                    title="Strikethrough"
                  />
                </div>
                {/* Text alignment */}
                <PropertyRow label="Align">
                  <div style={{ display: "flex", gap: 4 }}>
                    <SmallButton
                      icon={<AlignLeft size={13} />}
                      active={obj.textAlign === "left" || !obj.textAlign}
                      onClick={() => onPropertyChange("textAlign", "left")}
                      title="Align Left"
                    />
                    <SmallButton
                      icon={<AlignCenter size={13} />}
                      active={obj.textAlign === "center"}
                      onClick={() => onPropertyChange("textAlign", "center")}
                      title="Align Center"
                    />
                    <SmallButton
                      icon={<AlignRight size={13} />}
                      active={obj.textAlign === "right"}
                      onClick={() => onPropertyChange("textAlign", "right")}
                      title="Align Right"
                    />
                    <SmallButton
                      icon={<AlignJustify size={13} />}
                      active={obj.textAlign === "justify"}
                      onClick={() => onPropertyChange("textAlign", "justify")}
                      title="Justify"
                    />
                  </div>
                </PropertyRow>
                {/* Letter spacing */}
                <PropertyRow label="Spacing">
                  <NumberInput
                    value={obj.charSpacing || 0}
                    onChange={(v) => onPropertyChange("charSpacing", v)}
                    min={-200}
                    max={1000}
                    step={10}
                  />
                </PropertyRow>
                {/* Line height */}
                <PropertyRow label="Line H">
                  <NumberInput
                    value={obj.lineHeight || 1.16}
                    onChange={(v) => onPropertyChange("lineHeight", v)}
                    min={0.5}
                    max={5}
                    step={0.1}
                  />
                </PropertyRow>
              </>
            )}

            {/* Shadow */}
            <SectionHeader title="Effects" />
            <PropertyRow label="Shadow">
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={!!obj.shadow}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onPropertyChange("shadowEnabled", true);
                    } else {
                      onPropertyChange("shadowEnabled", false);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: 11, color: "#6e6e73" }}>
                  {obj.shadow ? "On" : "Off"}
                </span>
              </div>
            </PropertyRow>
            {obj.shadow && (
              <>
                <PropertyRow label="Color">
                  <ColorInput
                    value={obj.shadow.color || "#000000"}
                    onChange={(v) => onPropertyChange("shadowColor", v)}
                    label="Shadow"
                  />
                </PropertyRow>
                <PropertyRow label="Blur">
                  <NumberInput
                    value={obj.shadow.blur || 0}
                    onChange={(v) => onPropertyChange("shadowBlur", v)}
                    min={0}
                    max={100}
                  />
                </PropertyRow>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <PropertyRow label="X">
                    <NumberInput
                      value={obj.shadow.offsetX || 0}
                      onChange={(v) => onPropertyChange("shadowOffsetX", v)}
                    />
                  </PropertyRow>
                  <PropertyRow label="Y">
                    <NumberInput
                      value={obj.shadow.offsetY || 0}
                      onChange={(v) => onPropertyChange("shadowOffsetY", v)}
                    />
                  </PropertyRow>
                </div>
              </>
            )}

            {/* Transform */}
            <SectionHeader title="Transform" />
            <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
              <SmallButton
                icon={<FlipHorizontal2 size={13} />}
                active={obj.flipX === true}
                onClick={() => onPropertyChange("flipX", !obj.flipX)}
                title="Flip Horizontal"
              />
              <SmallButton
                icon={<FlipVertical2 size={13} />}
                active={obj.flipY === true}
                onClick={() => onPropertyChange("flipY", !obj.flipY)}
                title="Flip Vertical"
              />
            </div>

            {/* Alignment (when multiple selected) */}
            {hasMultipleSelection && onAlignObjects && (
              <>
                <SectionHeader title="Align" />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "4px 0" }}>
                  <SmallButton
                    icon={<AlignHorizontalJustifyStart size={13} />}
                    onClick={() => onAlignObjects("left")}
                    title="Align Left"
                  />
                  <SmallButton
                    icon={<AlignHorizontalJustifyCenter size={13} />}
                    onClick={() => onAlignObjects("centerH")}
                    title="Align Center Horizontal"
                  />
                  <SmallButton
                    icon={<AlignHorizontalJustifyEnd size={13} />}
                    onClick={() => onAlignObjects("right")}
                    title="Align Right"
                  />
                  <SmallButton
                    icon={<AlignVerticalJustifyStart size={13} />}
                    onClick={() => onAlignObjects("top")}
                    title="Align Top"
                  />
                  <SmallButton
                    icon={<AlignVerticalJustifyCenter size={13} />}
                    onClick={() => onAlignObjects("centerV")}
                    title="Align Center Vertical"
                  />
                  <SmallButton
                    icon={<AlignVerticalJustifyEnd size={13} />}
                    onClick={() => onAlignObjects("bottom")}
                    title="Align Bottom"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
