import { Copy, Trash2, ArrowUpToLine, ArrowDownToLine, Group, Ungroup } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import { useAppContext } from '../../store/canvasStore';

export default function ActionsSection() {
  const { state } = useAppContext();
  const multiSelected = state.selectedObjectIds.length > 1;

  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('vigma:action', { detail: action }));
  };

  const actions = [
    { icon: <Copy size={16} />, tooltip: 'Duplicate (Ctrl+D)', action: 'duplicate', disabled: false },
    { icon: <Trash2 size={16} />, tooltip: 'Delete (Del)', action: 'delete', disabled: false },
    { icon: <ArrowUpToLine size={16} />, tooltip: 'Bring to Front', action: 'bring-front', disabled: false },
    { icon: <ArrowDownToLine size={16} />, tooltip: 'Send to Back', action: 'send-back', disabled: false },
    { icon: <Group size={16} />, tooltip: 'Group (Ctrl+G)', action: 'group', disabled: !multiSelected },
    { icon: <Ungroup size={16} />, tooltip: 'Ungroup (Ctrl+Shift+G)', action: 'ungroup', disabled: false },
  ];

  return (
    <div>
      <SectionHeader title="Actions" />
      <div className="px-3 pb-3 flex gap-1 flex-wrap">
        {actions.map((a) => (
          <button
            key={a.action}
            className={`p-2 rounded text-[#a0a0a0] hover:bg-[#3c3c3c] hover:text-white transition-colors cursor-pointer ${a.disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={() => !a.disabled && handleAction(a.action)}
            title={a.tooltip}
          >
            {a.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
