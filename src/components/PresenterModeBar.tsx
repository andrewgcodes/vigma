'use client'
interface Props { onNext: () => void; onPrev: () => void; currentSlide: number; totalSlides: number; onExit: () => void }
// Feature 501: PresenterModeBar
export default function PresenterModeBar({ onNext, onPrev, currentSlide, totalSlides, onExit }: Props) {
  return (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white rounded-full px-4 py-2 flex items-center gap-4 z-[9999]"><button onClick={onPrev} className="text-sm hover:text-blue-300">&larr;</button><span className="text-sm">{currentSlide} / {totalSlides}</span><button onClick={onNext} className="text-sm hover:text-blue-300">&rarr;</button><button onClick={onExit} className="text-xs text-gray-400 hover:text-white ml-4">Exit</button></div>)
}