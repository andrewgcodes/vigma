'use client'
interface Props { zoom: number; onZoomChange: (z: number) => void }
// Feature 456: ZoomPresetButtons
export default function ZoomPresetButtons({ zoom, onZoomChange }: Props) {
  const presets = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]
  return (<div className="flex items-center gap-1">{presets.map(z => <button key={z} onClick={() => onZoomChange(z)} className={'px-2 py-0.5 text-xs rounded ' + (Math.abs(zoom-z)<0.01?'bg-blue-100 text-blue-700':'text-gray-500 hover:bg-gray-100')}>{Math.round(z*100)}%</button>)}</div>)
}