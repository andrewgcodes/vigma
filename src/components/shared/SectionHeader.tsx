
interface SectionHeaderProps {
  title: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  showToggle?: boolean;
}

export default function SectionHeader({ title, enabled = true, onToggle, showToggle = false }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
      <span className="text-[11px] text-[#a0a0a0] uppercase font-semibold tracking-wide">{title}</span>
      {showToggle && (
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle?.(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-7 h-4 rounded-full transition-colors ${enabled ? 'bg-[#7c5cfc]' : 'bg-[#3c3c3c]'}`}>
            <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      )}
    </div>
  );
}
