'use client'

import React, { useEffect } from 'react'
import { useDesignStore } from '@/store/useDesignStore'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

// Feature 73: Toast notification system
export default function ToastNotification() {
  const { toastMessage, toastType, clearToast } = useDesignStore()

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(clearToast, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage, clearToast])

  if (!toastMessage) return null

  const icons = {
    info: <Info size={16} className="text-blue-500" />,
    success: <CheckCircle size={16} className="text-green-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
    error: <XCircle size={16} className="text-red-500" />,
  }

  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-2">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border ${bgColors[toastType]}`}>
        {icons[toastType]}
        <span className="text-sm text-gray-800">{toastMessage}</span>
        <button onClick={clearToast} className="p-0.5 rounded hover:bg-black/5 text-gray-400 ml-2">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
