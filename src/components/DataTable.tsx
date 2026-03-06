'use client'
interface Props { columns: Array<{key:string;label:string}>; rows: Array<Record<string,string>>; onRowClick?: (row: Record<string,string>) => void }
// Feature 549: DataTable
export default function DataTable({ columns, rows, onRowClick }: Props) {
  return (<table className="w-full text-xs"><thead><tr className="border-b">{columns.map(c => <th key={c.key} className="text-left px-2 py-1.5 text-gray-500 font-semibold">{c.label}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr key={i} onClick={() => onRowClick?.(row)} className="border-b hover:bg-gray-50 cursor-pointer">{columns.map(c => <td key={c.key} className="px-2 py-1.5">{row[c.key]}</td>)}</tr>)}</tbody></table>)
}