import React, { useState, useRef } from 'react';
import { Plus, FileText, Trash2, MoreHorizontal } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { v4 as uuidv4 } from 'uuid';

interface PagesPanelProps {
  onSwitchPage: (pageId: string) => void;
}

export default function PagesPanel({ onSwitchPage }: PagesPanelProps) {
  const { state, addPage, deletePage, renamePage, setActivePage } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddPage = () => {
    const newPage = {
      id: uuidv4(),
      name: `Page ${state.pages.length + 1}`,
      canvasJSON: null,
    };
    addPage(newPage);
  };

  const handleStartRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleFinishRename = () => {
    if (editingId && editName.trim()) {
      renamePage(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleSwitchPage = (pageId: string) => {
    if (pageId !== state.activePageId) {
      onSwitchPage(pageId);
      setActivePage(pageId);
    }
  };

  return (
    <div className="border-b border-[#3c3c3c]">
      <div className="h-8 px-3 flex items-center justify-between">
        <span className="text-xs text-[#a0a0a0] font-semibold uppercase tracking-wider">Pages</span>
        <button
          className="text-[#a0a0a0] hover:text-white p-0.5"
          onClick={handleAddPage}
          title="Add Page"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="max-h-32 overflow-y-auto">
        {state.pages.map((page) => (
          <div
            key={page.id}
            className={`h-7 px-3 flex items-center gap-2 cursor-pointer transition-colors ${
              state.activePageId === page.id
                ? 'bg-[#7c5cfc33] text-white'
                : 'text-[#d0d0d0] hover:bg-[#333333]'
            }`}
            onClick={() => handleSwitchPage(page.id)}
            onDoubleClick={() => handleStartRename(page.id, page.name)}
          >
            <FileText size={12} className="text-[#a0a0a0] shrink-0" />
            {editingId === page.id ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 bg-[#1e1e1e] text-white text-xs h-5 px-1 rounded border border-[#7c5cfc] focus:outline-none min-w-0"
                autoFocus
              />
            ) : (
              <span className="text-xs truncate flex-1 min-w-0">{page.name}</span>
            )}
            {state.pages.length > 1 && (
              <button
                className="text-[#666] hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePage(page.id);
                }}
                title="Delete Page"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
