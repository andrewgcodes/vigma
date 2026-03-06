'use client'
interface Props { code: string; language?: string; showLineNumbers?: boolean; onCopy?: () => void }
// Feature 553: CodeBlock
export default function CodeBlock({ code, language, showLineNumbers, onCopy }: Props) {
  const lines = code.split('\n')
  return (<div className="relative bg-gray-900 rounded-lg overflow-hidden"><div className="flex justify-between items-center px-3 py-1 bg-gray-800"><span className="text-xs text-gray-400">{language||'code'}</span>{onCopy && <button onClick={onCopy} className="text-xs text-gray-400 hover:text-white">Copy</button>}</div><pre className="p-3 overflow-auto text-xs text-gray-100">{lines.map((line,i) => <div key={i} className="flex"><span className="text-gray-600 w-8 text-right mr-3 select-none">{showLineNumbers?i+1:''}</span><span>{line}</span></div>)}</pre></div>)
}