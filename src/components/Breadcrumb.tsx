'use client'
interface Props { items: Array<{label:string;onClick?:()=>void}> }
// Feature 514: Breadcrumb
export default function Breadcrumb({ items }: Props) {
  return (<div className="flex items-center gap-1 text-xs text-gray-500">{items.map((item, i) => <span key={i} className="flex items-center gap-1">{i > 0 && <span>/</span>}{item.onClick ? <button onClick={item.onClick} className="hover:text-blue-600">{item.label}</button> : <span className="text-gray-700">{item.label}</span>}</span>)}</div>)
}