'use client'
interface Props { onCrop: () => void; onReset: () => void; aspectRatio: string; onAspectChange: (r: string) => void }
// Feature 465: ImageCropControls
export default function ImageCropControls({ onCrop, onReset, aspectRatio, onAspectChange }: Props) {
  return (<div className="p-3 border-b"><div className="text-xs font-semibold text-gray-500 uppercase mb-2">Image Crop</div><div className="flex gap-1 mb-2">{['free','1:1','4:3','16:9','3:2'].map(r => <button key={r} onClick={() => onAspectChange(r)} className={'px-2 py-0.5 text-xs rounded border ' + (aspectRatio===r?'bg-blue-50 border-blue-300':'')}>{r}</button>)}</div><div className="flex gap-1"><button onClick={onCrop} className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded">Apply Crop</button><button onClick={onReset} className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">Reset</button></div></div>)
}