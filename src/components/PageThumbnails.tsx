'use client'
interface Page { id: string; name: string; thumbnail?: string }
interface Props { pages: Page[]; currentPageId: string; onSelectPage: (id: string) => void; showThumbnails: boolean }
export default function PageThumbnails({ pages, currentPageId, onSelectPage, showThumbnails }: Props) {
  if (!showThumbnails) return null
  return (<div className="flex gap-2 p-2 overflow-x-auto border-b">
    {pages.map(p => (<button key={p.id} onClick={() => onSelectPage(p.id)} className={'flex flex-col items-center gap-1 p-1 rounded ' + (currentPageId===p.id?'bg-blue-50 border border-blue-300':'')}>
      <div className="w-16 h-12 bg-gray-100 rounded border" />
      <span className="text-[10px] text-gray-500 truncate max-w-[64px]">{p.name}</span>
    </button>))}
  </div>)
}