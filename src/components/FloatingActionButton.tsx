'use client'
interface Props { onClick: () => void; icon: string; label?: string; position?: string }
// Feature 540: FloatingActionButton
export default function FloatingActionButton({ onClick, icon, label, position }: Props) {
  const pos = position === 'left' ? 'left-4' : 'right-4'
  return (<button onClick={onClick} className={'fixed bottom-4 z-[200] w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 flex items-center justify-center text-xl transition-transform hover:scale-110 ' + pos} title={label}>{icon}</button>)
}