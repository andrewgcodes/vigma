'use client'
import React from 'react'
interface Props { nodes: Array<{id:string;label:string;children?:Array<{id:string;label:string}>}>; onSelect: (id: string) => void; selectedId: string | null }
// Feature 548: TreeView
export default function TreeView({ nodes, onSelect, selectedId }: Props) {
  return (<div className="text-xs">{nodes.map(n => <TreeNode key={n.id} node={n} onSelect={onSelect} selectedId={selectedId} />)}</div>)
}
function TreeNode({node,onSelect,selectedId}:{node:{id:string;label:string;children?:Array<{id:string;label:string}>};onSelect:(id:string)=>void;selectedId:string|null}) {
  const [open,setOpen] = React.useState(true)
  return (<div><div className={'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-50 ' + (selectedId===node.id?'bg-blue-50':'')}>{node.children && <button onClick={() => setOpen(!open)} className="text-gray-400">{open?'-':'+'}</button>}<span onClick={() => onSelect(node.id)}>{node.label}</span></div>{open && node.children && <div className="ml-4">{node.children.map(c => <div key={c.id} onClick={() => onSelect(c.id)} className={'px-2 py-1 cursor-pointer hover:bg-gray-50 ' + (selectedId===c.id?'bg-blue-50':'')}>{c.label}</div>)}</div>}</div>)
}