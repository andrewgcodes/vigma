'use client'
interface Props { currentPage: number; totalPages: number; onPageChange: (page: number) => void }
// Feature 550: Pagination
export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const pages = Array.from({length:Math.min(5,totalPages)},(_,i) => {const start=Math.max(1,currentPage-2);return start+i}).filter(p=>p<=totalPages)
  return (<div className="flex items-center gap-1">{currentPage>1 && <button onClick={() => onPageChange(currentPage-1)} className="px-2 py-1 text-xs bg-gray-100 rounded">&laquo;</button>}{pages.map(p => <button key={p} onClick={() => onPageChange(p)} className={'px-2 py-1 text-xs rounded ' + (p===currentPage?'bg-blue-500 text-white':'bg-gray-100')}>{p}</button>)}{currentPage<totalPages && <button onClick={() => onPageChange(currentPage+1)} className="px-2 py-1 text-xs bg-gray-100 rounded">&raquo;</button>}</div>)
}