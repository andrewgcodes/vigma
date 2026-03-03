import React from 'react';
import { Copy, Trash2, ArrowUpToLine, ArrowDownToLine, Group, Ungroup } from 'lucide-react';

interface ActionsSectionProps {
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  canGroup: boolean;
  canUngroup: boolean;
}

export default function ActionsSection({
  onDuplicate, onDelete, onBringToFront, onSendToBack,
  onGroup, onUngroup, canGroup, canUngroup,
}: ActionsSectionProps) {
  const buttons = [
    { icon: Copy, tooltip: 'Duplicate (Ctrl+D)', onClick: onDuplicate, disabled: false },
    { icon: Trash2, tooltip: 'Delete (Del)', onClick: onDelete, disabled: false },
    { icon: ArrowUpToLine, tooltip: 'Bring to Front', onClick: onBringToFront, disabled: false },
    { icon: ArrowDownToLine, tooltip: 'Send to Back', onClick: onSendToBack, disabled: false },
    { icon: Group, tooltip: 'Group (Ctrl+G)', onClick: onGroup, disabled: !canGroup },
    { icon: Ungroup, tooltip: 'Ungroup (Ctrl+Shift+G)', onClick: onUngroup, disabled: !canUngroup },
  ];

  return (
    <div className="px-3 py-2 border-t border-[#3c3c3c]">
      <div className="flex items-center gap-1">
        {buttons.map(({ icon: Icon, tooltip, onClick, disabled }) => (
          <button
            key={tooltip}
            className={`p-2 rounded hover:bg-[#3c3c3c] transition-colors ${
              disabled ? 'opacity-30 cursor-not-allowed' : 'text-[#a0a0a0] hover:text-white cursor-pointer'
            }`}
            onClick={onClick}
            disabled={disabled}
            title={tooltip}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
