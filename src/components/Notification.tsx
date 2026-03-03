'use client';

import React from 'react';
import { useDesignStore } from '@/store/useDesignStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Notification() {
  const notification = useDesignStore((s) => s.notification);
  const clearNotification = useDesignStore((s) => s.clearNotification);

  if (!notification) return null;

  const icons = {
    info: <Info size={16} className="text-canvas-accent" />,
    success: <CheckCircle size={16} className="text-green-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-dropdown border border-canvas-border px-4 py-2.5">
        {icons[notification.type]}
        <span className="text-xs text-canvas-text">{notification.message}</span>
        <button
          onClick={clearNotification}
          className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-secondary ml-2"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
