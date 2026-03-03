import React from 'react';
import { PanelRightClose, PanelRightOpen, MoveHorizontal, MoveVertical, Maximize2 } from 'lucide-react';
import { useAppContext } from '../../store/canvasStore';
import { FabricObject, Textbox, Rect, Shadow } from 'fabric';
import TransformSection from './TransformSection';
import AlignmentSection from './AlignmentSection';
import FillSection from './FillSection';
import StrokeSection from './StrokeSection';
import OpacitySection from './OpacitySection';
import ShadowSection from './ShadowSection';
import TextSection from './TextSection';
import ActionsSection from './ActionsSection';
import ColorStylesPanel from './ColorStylesPanel';
import NumberInput from '../shared/NumberInput';
import SectionHeader from '../shared/SectionHeader';

interface RightSidebarProps {
  selectedObjects: FabricObject[];
  onPropertyChange: (prop: string, value: unknown) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onAlign: (alignment: string) => void;
  onMakeComponent: () => void;
}

export default function RightSidebar({
  selectedObjects, onPropertyChange, onDuplicate, onDelete,
  onBringToFront, onSendToBack, onGroup, onUngroup,
  onAlign, onMakeComponent,
}: RightSidebarProps) {
  const { state, dispatch } = useAppContext();

  if (!state.rightSidebarOpen) {
    return (
      <div className="w-2 bg-[#252525] border-l border-[#3c3c3c] flex items-start pt-2 justify-center">
        <button
          className="text-[#a0a0a0] hover:text-white"
          onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
        >
          <PanelRightOpen size={14} />
        </button>
      </div>
    );
  }

  if (selectedObjects.length === 0) {
    return (
      <div className="w-[280px] bg-[#252525] border-l border-[#3c3c3c] flex flex-col">
        <div className="flex items-center justify-end px-2 pt-2">
          <button
            className="text-[#a0a0a0] hover:text-white p-0.5"
            onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
          >
            <PanelRightClose size={14} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[#666666] text-[13px] italic text-center">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const obj = selectedObjects[0];
  const isText = obj instanceof Textbox;
  const isRect = obj instanceof Rect;
  const isLine = (obj as FabricObject & { customType?: string }).customType === 'line' || (obj as FabricObject & { customType?: string }).customType === 'arrow';
  const hasMultiple = selectedObjects.length > 1;

  const bounds = obj.getBoundingRect();
  const x = Math.round((obj.left ?? 0) * 10) / 10;
  const y = Math.round((obj.top ?? 0) * 10) / 10;
  const w = Math.round((obj.width ?? 0) * (obj.scaleX ?? 1) * 10) / 10;
  const h = Math.round((obj.height ?? 0) * (obj.scaleY ?? 1) * 10) / 10;
  const rotation = Math.round((obj.angle ?? 0) * 10) / 10;
  const opacity = obj.opacity ?? 1;

  const fillColor = typeof obj.fill === 'string' ? obj.fill : '#7c5cfc';
  const hasFill = !!obj.fill && obj.fill !== 'transparent' && obj.fill !== '';
  const strokeColor = typeof obj.stroke === 'string' ? obj.stroke : '#000000';
  const hasStroke = !!obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== '';
  const strokeWidth = obj.strokeWidth ?? 1;
  const strokeDashArray = obj.strokeDashArray;
  let strokeStyle = 'solid';
  if (strokeDashArray && strokeDashArray.length > 0) {
    if (strokeDashArray[0] <= 3) strokeStyle = 'dotted';
    else strokeStyle = 'dashed';
  }

  const shadow = obj.shadow as Shadow | null;
  const hasShadow = !!shadow;
  const shadowColor = (shadow?.color as string) || '#000000';
  const shadowOffsetX = shadow?.offsetX ?? 4;
  const shadowOffsetY = shadow?.offsetY ?? 4;
  const shadowBlur = shadow?.blur ?? 10;

  const cornerRadius = isRect ? ((obj as Rect).rx ?? 0) : 0;

  // Text properties
  const textObj = isText ? (obj as Textbox) : null;
  const fontFamily = textObj?.fontFamily ?? 'Inter';
  const fontSize = textObj?.fontSize ?? 24;
  const fontWeight = String(textObj?.fontWeight ?? 'normal');
  const textAlign = textObj?.textAlign ?? 'left';
  const textFill = typeof textObj?.fill === 'string' ? textObj.fill : '#ffffff';
  const lineHeight = textObj?.lineHeight ?? 1.2;
  const charSpacing = textObj?.charSpacing ?? 0;

  const isGroup = obj.type === 'group';
  const isFrame = (obj as FabricObject & { customType?: string }).customType === 'frame';

  return (
    <div className="w-[280px] bg-[#252525] border-l border-[#3c3c3c] flex flex-col overflow-y-auto select-none">
      <div className="flex items-center justify-end px-2 pt-2">
        <button
          className="text-[#a0a0a0] hover:text-white p-0.5"
          onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      <AlignmentSection
        onAlign={onAlign}
        enabled={hasMultiple}
      />

      <TransformSection
        x={x} y={y} width={w} height={h} rotation={rotation}
        onChange={(prop, val) => onPropertyChange(prop, val)}
      />

      {/* Layout / Resizing section */}
      <div>
        <SectionHeader title="Layout" />
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-[#a0a0a0] w-16">Resizing</span>
            <div className="flex gap-0.5">
              {[
                { key: 'hug', icon: MoveHorizontal, label: 'Hug' },
                { key: 'fixed', icon: Maximize2, label: 'Fixed' },
                { key: 'fill', icon: MoveVertical, label: 'Fill' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  className="px-2 py-1 rounded text-[10px] text-[#a0a0a0] hover:text-white hover:bg-[#3c3c3c] transition-colors border border-[#3c3c3c]"
                  title={label}
                >
                  <Icon size={12} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isLine && (
        <FillSection
          enabled={hasFill}
          color={fillColor}
          onToggle={(enabled) => onPropertyChange('fill', enabled ? '#7c5cfc' : 'transparent')}
          onChange={(color) => onPropertyChange('fill', color)}
        />
      )}

      <StrokeSection
        enabled={hasStroke}
        color={strokeColor}
        width={strokeWidth}
        style={strokeStyle}
        onToggle={(enabled) => {
          onPropertyChange('stroke', enabled ? '#000000' : 'transparent');
          if (enabled) onPropertyChange('strokeWidth', 1);
        }}
        onColorChange={(color) => onPropertyChange('stroke', color)}
        onWidthChange={(w) => onPropertyChange('strokeWidth', w)}
        onStyleChange={(style) => {
          if (style === 'solid') onPropertyChange('strokeDashArray', null);
          else if (style === 'dashed') onPropertyChange('strokeDashArray', [10, 5]);
          else onPropertyChange('strokeDashArray', [2, 2]);
        }}
      />

      <OpacitySection value={opacity} onChange={(v) => onPropertyChange('opacity', v)} />

      {isRect && (
        <div>
          <SectionHeader title="Corner Radius" />
          <div className="px-3 pb-2">
            <NumberInput
              label="R"
              value={cornerRadius}
              onChange={(v) => { onPropertyChange('rx', v); onPropertyChange('ry', v); }}
              min={0}
              max={100}
            />
          </div>
        </div>
      )}

      <ShadowSection
        enabled={hasShadow}
        color={shadowColor}
        offsetX={shadowOffsetX}
        offsetY={shadowOffsetY}
        blur={shadowBlur}
        onToggle={(enabled) => {
          if (enabled) {
            onPropertyChange('shadow', new Shadow({ color: 'rgba(0,0,0,0.5)', offsetX: 4, offsetY: 4, blur: 10 }));
          } else {
            onPropertyChange('shadow', null);
          }
        }}
        onColorChange={(color) => {
          onPropertyChange('shadow', new Shadow({ color, offsetX: shadowOffsetX, offsetY: shadowOffsetY, blur: shadowBlur }));
        }}
        onOffsetXChange={(v) => {
          onPropertyChange('shadow', new Shadow({ color: shadowColor, offsetX: v, offsetY: shadowOffsetY, blur: shadowBlur }));
        }}
        onOffsetYChange={(v) => {
          onPropertyChange('shadow', new Shadow({ color: shadowColor, offsetX: shadowOffsetX, offsetY: v, blur: shadowBlur }));
        }}
        onBlurChange={(v) => {
          onPropertyChange('shadow', new Shadow({ color: shadowColor, offsetX: shadowOffsetX, offsetY: shadowOffsetY, blur: v }));
        }}
      />

      {isText && textObj && (
        <TextSection
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={fontWeight}
          textAlign={textAlign}
          fill={textFill}
          lineHeight={lineHeight}
          charSpacing={charSpacing}
          onFontFamilyChange={(v) => onPropertyChange('fontFamily', v)}
          onFontSizeChange={(v) => onPropertyChange('fontSize', v)}
          onFontWeightChange={(v) => onPropertyChange('fontWeight', v)}
          onTextAlignChange={(v) => onPropertyChange('textAlign', v)}
          onFillChange={(v) => onPropertyChange('fill', v)}
          onLineHeightChange={(v) => onPropertyChange('lineHeight', v)}
          onCharSpacingChange={(v) => onPropertyChange('charSpacing', v)}
        />
      )}

      <ColorStylesPanel
        currentColor={fillColor}
        onApplyColor={(color) => onPropertyChange('fill', color)}
      />

      <ActionsSection
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onBringToFront={onBringToFront}
        onSendToBack={onSendToBack}
        onGroup={onGroup}
        onUngroup={onUngroup}
        canGroup={hasMultiple}
        canUngroup={isGroup}
      />
    </div>
  );
}
