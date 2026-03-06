'use client'
interface Props { columns: number; gap: number; children: React.ReactNode }
// Feature 542: ResponsiveGrid
export default function ResponsiveGrid({ columns, gap, children }: Props) {
  return (<div className="grid" style={{gridTemplateColumns:'repeat('+columns+',1fr)',gap:gap+'px'}}>{children}</div>)
}