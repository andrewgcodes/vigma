import { useState, useEffect } from 'react';
import { Plus, Minus, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Shadow } from 'fabric';
import ColorPicker from '../ColorPicker/ColorPicker';
import SectionHeader from '../shared/SectionHeader';
import NumberInput from '../shared/NumberInput';
import { useAppContext } from '../../store/canvasStore';
import type { FabricObject } from 'fabric';

interface EffectsSectionProps {
  obj: FabricObject;
}

type EffectType = 'drop-shadow' | 'inner-shadow' | 'layer-blur' | 'background-blur';

interface EffectConfig {
  type: EffectType;
  visible: boolean;
  expanded: boolean;
  // Shadow props
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
}

export default function EffectsSection({ obj }: EffectsSectionProps) {
  const { canvasRef } = useAppContext();
  const [effects, setEffects] = useState<EffectConfig[]>(() => {
    const shadow = obj.shadow instanceof Shadow ? obj.shadow : null;
    if (shadow) {
      return [{
        type: 'drop-shadow' as EffectType,
        visible: true,
        expanded: false,
        color: shadow.color || 'rgba(0,0,0,0.25)',
        offsetX: shadow.offsetX || 0,
        offsetY: shadow.offsetY || 4,
        blur: shadow.blur || 4,
        spread: 0,
      }];
    }
    return [];
  });

  useEffect(() => {
    const shadow = obj.shadow instanceof Shadow ? obj.shadow : null;
    if (shadow && effects.length === 0) {
      setEffects([{
        type: 'drop-shadow',
        visible: true,
        expanded: false,
        color: shadow.color || 'rgba(0,0,0,0.25)',
        offsetX: shadow.offsetX || 0,
        offsetY: shadow.offsetY || 4,
        blur: shadow.blur || 4,
        spread: 0,
      }]);
    }
  }, [obj.shadow, effects.length]);

  const applyEffects = (newEffects: EffectConfig[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Apply first visible drop shadow
    const dropShadow = newEffects.find((e) => e.type === 'drop-shadow' && e.visible);
    if (dropShadow) {
      obj.set({
        shadow: new Shadow({
          color: dropShadow.color || 'rgba(0,0,0,0.25)',
          offsetX: dropShadow.offsetX || 0,
          offsetY: dropShadow.offsetY || 4,
          blur: dropShadow.blur || 4,
        }),
      });
    } else {
      obj.set({ shadow: undefined });
    }

    // Apply blur effects
    const layerBlur = newEffects.find((e) => e.type === 'layer-blur' && e.visible);
    if (layerBlur) {
      // Fabric.js doesn't have native blur, simulate with opacity
      // We store blur value for UI purposes
    }

    canvas.requestRenderAll();
    window.dispatchEvent(new CustomEvent('vigma:save-history'));
  };

  const addEffect = () => {
    const newEffect: EffectConfig = {
      type: 'drop-shadow',
      visible: true,
      expanded: true,
      color: 'rgba(0,0,0,0.25)',
      offsetX: 0,
      offsetY: 4,
      blur: 4,
      spread: 0,
    };
    const newEffects = [...effects, newEffect];
    setEffects(newEffects);
    applyEffects(newEffects);
  };

  const removeEffect = (index: number) => {
    const newEffects = effects.filter((_, i) => i !== index);
    setEffects(newEffects);
    applyEffects(newEffects);
  };

  const updateEffect = (index: number, updates: Partial<EffectConfig>) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    setEffects(newEffects);
    applyEffects(newEffects);
  };

  const toggleVisibility = (index: number) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], visible: !newEffects[index].visible };
    setEffects(newEffects);
    applyEffects(newEffects);
  };

  const toggleExpanded = (index: number) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], expanded: !newEffects[index].expanded };
    setEffects(newEffects);
  };

  const effectTypeLabels: Record<EffectType, string> = {
    'drop-shadow': 'Drop shadow',
    'inner-shadow': 'Inner shadow',
    'layer-blur': 'Layer blur',
    'background-blur': 'Background blur',
  };

  return (
    <div>
      <SectionHeader title="Effects">
        <button
          className="p-0.5 rounded text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] cursor-pointer"
          onClick={addEffect}
          title="Add effect"
        >
          <Plus size={12} />
        </button>
      </SectionHeader>
      {effects.length > 0 && (
        <div className="px-3 pb-2 space-y-1">
          {effects.map((effect, i) => (
            <div key={i} className="bg-[#1e1e1e] rounded border border-[#3c3c3c]">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  className="p-0.5 text-[#a0a0a0] hover:text-white cursor-pointer"
                  onClick={() => toggleExpanded(i)}
                >
                  <ChevronDown size={10} className={`transition-transform ${effect.expanded ? '' : '-rotate-90'}`} />
                </button>
                <select
                  value={effect.type}
                  onChange={(e) => updateEffect(i, { type: e.target.value as EffectType })}
                  className="bg-transparent text-white text-xs flex-1 focus:outline-none cursor-pointer"
                >
                  {Object.entries(effectTypeLabels).map(([value, label]) => (
                    <option key={value} value={value} className="bg-[#2c2c2c]">{label}</option>
                  ))}
                </select>
                <button
                  className="p-0.5 text-[#a0a0a0] hover:text-white cursor-pointer"
                  onClick={() => toggleVisibility(i)}
                  title={effect.visible ? 'Hide' : 'Show'}
                >
                  {effect.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  className="p-0.5 text-[#a0a0a0] hover:text-white cursor-pointer"
                  onClick={() => removeEffect(i)}
                  title="Remove"
                >
                  <Minus size={12} />
                </button>
              </div>

              {effect.expanded && (effect.type === 'drop-shadow' || effect.type === 'inner-shadow') && (
                <div className="px-2 pb-2 space-y-2 border-t border-[#3c3c3c] pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#a0a0a0]">Position</label>
                    <div className="grid grid-cols-2 gap-1">
                      <NumberInput label="X" value={effect.offsetX || 0} onChange={(v) => updateEffect(i, { offsetX: v })} min={-100} max={100} />
                      <NumberInput label="Y" value={effect.offsetY || 0} onChange={(v) => updateEffect(i, { offsetY: v })} min={-100} max={100} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <NumberInput label="Blur" value={effect.blur || 0} onChange={(v) => updateEffect(i, { blur: v })} min={0} max={100} />
                    <NumberInput label="Spread" value={effect.spread || 0} onChange={(v) => updateEffect(i, { spread: v })} min={-50} max={100} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-[#a0a0a0]">Color</label>
                    <ColorPicker color={effect.color || '#000000'} onChange={(c) => updateEffect(i, { color: c })} />
                    <span className="text-[10px] text-[#a0a0a0] font-mono">
                      {(effect.color || '#000000').replace('#', '').toUpperCase().slice(0, 6)}
                    </span>
                    <span className="text-[10px] text-[#a0a0a0]">25%</span>
                  </div>
                </div>
              )}

              {effect.expanded && effect.type === 'layer-blur' && (
                <div className="px-2 pb-2 border-t border-[#3c3c3c] pt-2">
                  <NumberInput label="Blur" value={effect.blur || 0} onChange={(v) => updateEffect(i, { blur: v })} min={0} max={100} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
