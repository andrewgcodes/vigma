'use client'
interface Props { fontFamily: string; sampleText?: string; onClick?: () => void; selected?: boolean }
// Feature 555: FontPreview
export default function FontPreview({ fontFamily, sampleText, onClick, selected }: Props) {
  return (<button onClick={onClick} className={'w-full text-left p-2 border rounded hover:bg-gray-50 ' + (selected?'border-blue-300 bg-blue-50':'')}><div className="text-xs text-gray-400 mb-0.5">{fontFamily}</div><div className="text-sm truncate" style={{fontFamily}}>{sampleText||'The quick brown fox jumps over the lazy dog'}</div></button>)
}