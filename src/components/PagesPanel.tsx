'use client';

import React, { useState } from 'react';
import { useDesignStore } from '@/store/useDesignStore';
import { Plus, Trash2, FileText } from 'lucide-react';

export default function PagesPanel() {
  const pages = useDesignStore((s) => s.pages);
  const currentPageId = useDesignStore((s) => s.currentPageId);
  const setCurrentPage = useDesignStore((s) => s.setCurrentPage);
  const addPage = useDesignStore((s) => s.addPage);
  const renamePage = useDesignStore((s) => s.renamePage);
  const deletePage = useDesignStore((s) => s.deletePage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleDoubleClick = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleRenameSubmit = () => {
    if (editingId && editName.trim()) {
      renamePage(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
        <div className="flex items-center gap-1.5">
          <FileText size={14} className="text-canvas-text-secondary" />
          <span className="text-xs font-medium text-canvas-text">Pages</span>
        </div>
        <button
          onClick={() => addPage(`Page ${pages.length + 1}`)}
          className="p-1 rounded hover:bg-canvas-hover text-canvas-text-secondary"
          title="Add Page"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer group ${
              currentPageId === page.id
                ? 'bg-canvas-accent/10 text-canvas-accent'
                : 'hover:bg-canvas-hover text-canvas-text'
            }`}
            onClick={() => setCurrentPage(page.id)}
            onDoubleClick={() => handleDoubleClick(page.id, page.name)}
          >
            <FileText size={14} className="opacity-50" />
            {editingId === page.id ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
                className="flex-1 text-xs bg-white border border-canvas-accent rounded px-1 py-0.5 outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-xs">{page.name}</span>
            )}
            {pages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-canvas-text-secondary hover:text-red-500 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
