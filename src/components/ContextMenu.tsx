"use client";

import React from "react";
import {
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  CopyPlus,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { useStore } from "@/store/useStore";

interface ContextMenuProps {
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  hasSelection: boolean;
  hasMultipleSelection: boolean;
  isGroup: boolean;
  hasClipboard: boolean;
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 12px",
        border: "none",
        background: "transparent",
        borderRadius: 6,
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        color: disabled ? "#a1a1a6" : danger ? "#ff3b30" : "#1d1d1f",
        fontFamily: "Inter, sans-serif",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "#f0f0f2";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: disabled ? "#a1a1a6" : "#6e6e73", display: "flex" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && (
        <span style={{ fontSize: 11, color: "#a1a1a6", fontFamily: "monospace" }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Separator() {
  return <div style={{ height: 1, background: "#e5e5e7", margin: "4px 8px" }} />;
}

export default function ContextMenu({
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  hasSelection,
  hasMultipleSelection,
  isGroup,
  hasClipboard,
}: ContextMenuProps) {
  const { contextMenu, setContextMenu } = useStore();

  if (!contextMenu.visible) return null;

  const close = () => setContextMenu({ visible: false, x: 0, y: 0 });

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 98,
        }}
        onClick={close}
        onContextMenu={(e) => { e.preventDefault(); close(); }}
      />
      <div
        style={{
          position: "fixed",
          left: contextMenu.x,
          top: contextMenu.y,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: 10,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.05)",
          padding: 4,
          minWidth: 200,
          zIndex: 99,
        }}
        className="animate-fade"
      >
        <MenuItem
          icon={<Copy size={14} />}
          label="Copy"
          shortcut="⌘C"
          onClick={() => { onCopy(); close(); }}
          disabled={!hasSelection}
        />
        <MenuItem
          icon={<Scissors size={14} />}
          label="Cut"
          shortcut="⌘X"
          onClick={() => { onCut(); close(); }}
          disabled={!hasSelection}
        />
        <MenuItem
          icon={<ClipboardPaste size={14} />}
          label="Paste"
          shortcut="⌘V"
          onClick={() => { onPaste(); close(); }}
          disabled={!hasClipboard}
        />
        <MenuItem
          icon={<CopyPlus size={14} />}
          label="Duplicate"
          shortcut="⌘D"
          onClick={() => { onDuplicate(); close(); }}
          disabled={!hasSelection}
        />
        <Separator />
        {hasMultipleSelection && (
          <MenuItem
            icon={<Group size={14} />}
            label="Group"
            shortcut="⌘G"
            onClick={() => { onGroup(); close(); }}
          />
        )}
        {isGroup && (
          <MenuItem
            icon={<Ungroup size={14} />}
            label="Ungroup"
            shortcut="⌘⇧G"
            onClick={() => { onUngroup(); close(); }}
          />
        )}
        {(hasMultipleSelection || isGroup) && <Separator />}
        <MenuItem
          icon={<ArrowUp size={14} />}
          label="Bring Forward"
          shortcut="⌘]"
          onClick={() => { onBringForward(); close(); }}
          disabled={!hasSelection}
        />
        <MenuItem
          icon={<ArrowDown size={14} />}
          label="Send Backward"
          shortcut="⌘["
          onClick={() => { onSendBackward(); close(); }}
          disabled={!hasSelection}
        />
        <MenuItem
          icon={<ChevronsUp size={14} />}
          label="Bring to Front"
          shortcut="⌘⇧]"
          onClick={() => { onBringToFront(); close(); }}
          disabled={!hasSelection}
        />
        <MenuItem
          icon={<ChevronsDown size={14} />}
          label="Send to Back"
          shortcut="⌘⇧["
          onClick={() => { onSendToBack(); close(); }}
          disabled={!hasSelection}
        />
        <Separator />
        <MenuItem
          icon={<Trash2 size={14} />}
          label="Delete"
          shortcut="⌫"
          onClick={() => { onDelete(); close(); }}
          disabled={!hasSelection}
          danger
        />
      </div>
    </>
  );
}
