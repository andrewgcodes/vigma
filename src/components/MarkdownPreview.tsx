'use client'
interface Props { content: string; compact?: boolean }
// Feature 551: MarkdownPreview
export default function MarkdownPreview({ content, compact }: Props) {
  const lines = content.split('\n')
  return (<div className={'prose prose-sm ' + (compact?'text-xs':'text-sm')}>{lines.map((line,i) => {if(line.startsWith('# '))return <h1 key={i} className="text-lg font-bold">{line.slice(2)}</h1>;if(line.startsWith('## '))return <h2 key={i} className="text-base font-semibold">{line.slice(3)}</h2>;if(line.startsWith('- '))return <li key={i} className="ml-4">{line.slice(2)}</li>;if(line.startsWith('**'))return <p key={i} className="font-bold">{line.replace(/\*\*/g,'')}</p>;return <p key={i}>{line}</p>})}</div>)
}