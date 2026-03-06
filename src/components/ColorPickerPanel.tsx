'use client'
import { useState, useCallback } from 'react'
interface Props { open: boolean; onClose: () => void; color: string; onChange: (c: string) => void; mode: string; recentColors: string[]; favoriteColors: string[]; onAddFavorite: (c: string) => void }
// Feature 403: Advanced Color Picker Panel
export default function ColorPickerPanel({ open, onClose, color, onChange, mode, recentColors, favoriteColors, onAddFavorite }: Props) {
  const [hex, setHex] = useState(color)
  const presets = ['#EF4444','#F97316','#F59E0B','#22C55E','#14B8A6','#3B82F6','#6366F1','#8B5CF6','#EC4899','#000000','#6B7280','#FFFFFF']
  const handleHex = useCallback((v: string) => { setHex(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v) }, [onChange])
  if (!open) return null
  return (<div className="fixed right-4 top-20 z-[200] w-[260px] bg-white rounded-lg shadow-xl border p-3">
    <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium capitalize">{mode} Color</span><button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button></div>
    <div className="w-full h-24 rounded mb-2 border" style={{ background: hex }} />
    <input value={hex} onChange={e => handleHex(e.target.value)} className="w-full px-2 py-1 text-sm border rounded mb-2 font-mono" />
    <div className="mb-2"><div className="text-xs text-gray-500 mb-1">Presets</div><div className="flex flex-wrap gap-1">{presets.map(c => <button key={c} onClick={() => { setHex(c); onChange(c) }} className="w-5 h-5 rounded border" style={{ background: c }} />)}</div></div>
    {recentColors.length > 0 && <div className="mb-2"><div className="text-xs text-gray-500 mb-1">Recent</div><div className="flex flex-wrap gap-1">{recentColors.map(c => <button key={c} onClick={() => { setHex(c); onChange(c) }} className="w-5 h-5 rounded border" style={{ background: c }} />)}</div></div>}
    <button onClick={() => onAddFavorite(hex)} className="w-full text-xs text-blue-500 hover:text-blue-600 mt-1">Add to favorites</button>
  </div>)
}