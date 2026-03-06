'use client'
interface Props { device: string; onDeviceChange: (d: string) => void; children: React.ReactNode }
// Feature 486: DevicePreview
export default function DevicePreview({ device, onDeviceChange, children }: Props) {
  const devices = [{id:'iphone14',w:390,h:844},{id:'ipad',w:768,h:1024},{id:'macbook',w:1280,h:800},{id:'desktop',w:1920,h:1080}]
  const d = devices.find(x => x.id === device) || devices[0]
  return (<div className="flex flex-col items-center p-4 bg-gray-100 min-h-[300px]"><div className="flex gap-2 mb-3">{devices.map(dev => <button key={dev.id} onClick={() => onDeviceChange(dev.id)} className={'px-2 py-1 text-xs rounded ' + (device===dev.id?'bg-blue-100 text-blue-700':'text-gray-500')}>{dev.id}</button>)}</div><div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden" style={{width:d.w/3,height:d.h/3}}>{children}</div><div className="text-xs text-gray-400 mt-2">{d.w} x {d.h}</div></div>)
}