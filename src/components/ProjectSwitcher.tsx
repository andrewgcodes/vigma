'use client'
interface Props { projects: Array<{id:string;name:string;lastModified:number}>; currentProjectId: string; onSwitch: (id: string) => void; onNewProject: () => void }
// Feature 600: ProjectSwitcher
export default function ProjectSwitcher({ projects, currentProjectId, onSwitch, onNewProject }: Props) {
  return (<div className="p-3"><div className="flex justify-between items-center mb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Projects</span><button onClick={onNewProject} className="text-xs text-blue-500">+ New</button></div>{projects.map(p => <button key={p.id} onClick={() => onSwitch(p.id)} className={'w-full text-left p-2 rounded mb-1 ' + (currentProjectId===p.id?'bg-blue-50 border border-blue-200':'hover:bg-gray-50')}><div className="text-xs font-medium">{p.name}</div><div className="text-[10px] text-gray-400">{new Date(p.lastModified).toLocaleDateString()}</div></button>)}</div>)
}