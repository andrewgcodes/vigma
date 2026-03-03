import { useEffect, useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import AlignmentSection from './AlignmentSection';
import TransformSection from './TransformSection';
import FillSection from './FillSection';
import StrokeSection from './StrokeSection';
import OpacitySection from './OpacitySection';
import CornerRadiusSection from './CornerRadiusSection';
import EffectsSection from './EffectsSection';
import TextSection from './TextSection';
import ExportSection from './ExportSection';
import ActionsSection from './ActionsSection';
import { useAppContext } from '../../store/canvasStore';
import { findObjectById } from '../../utils/canvasHelpers';
import type { FabricObject, Textbox, Rect } from 'fabric';

export default function RightSidebar() {
  const { state, dispatch, canvasRef } = useAppContext();
  const [selectedObj, setSelectedObj] = useState<FabricObject | null>(null);
  const [, setUpdateKey] = useState(0);

  useEffect(() => {
    if (state.selectedObjectIds.length === 1) {
      const canvas = canvasRef.current;
      if (canvas) {
        const obj = findObjectById(canvas, state.selectedObjectIds[0]);
        setSelectedObj(obj || null);
      }
    } else if (state.selectedObjectIds.length > 1) {
      const canvas = canvasRef.current;
      if (canvas) {
        const activeObj = canvas.getActiveObject();
        setSelectedObj(activeObj || null);
      }
    } else {
      setSelectedObj(null);
    }
  }, [state.selectedObjectIds, canvasRef]);

  useEffect(() => {
    const handleUpdate = () => setUpdateKey((k) => k + 1);
    window.addEventListener('vigma:props-update', handleUpdate);
    return () => window.removeEventListener('vigma:props-update', handleUpdate);
  }, []);

  if (!state.rightSidebarOpen) {
    return (
      <div className="w-2 bg-[#252525] border-l border-[#3c3c3c] flex items-start pt-2 justify-center shrink-0">
        <button
          className="text-[#a0a0a0] hover:text-white cursor-pointer"
          onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
        >
          <PanelRightOpen size={14} />
        </button>
      </div>
    );
  }

  const isText = selectedObj?.type === 'textbox';
  const isRect = selectedObj?.type === 'rect';
  const isLine = selectedObj?.type === 'line';

  return (
    <div className="w-70 bg-[#252525] border-l border-[#3c3c3c] flex flex-col shrink-0">
      {/* Design / Prototype Tabs */}
      <div className="flex items-center border-b border-[#3c3c3c]">
        <button
          className={`flex-1 h-9 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
            state.rightSidebarTab === 'design'
              ? 'text-white border-b-2 border-[#7c5cfc]'
              : 'text-[#a0a0a0] hover:text-white'
          }`}
          onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_TAB', tab: 'design' })}
        >
          Design
        </button>
        <button
          className={`flex-1 h-9 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
            state.rightSidebarTab === 'prototype'
              ? 'text-white border-b-2 border-[#7c5cfc]'
              : 'text-[#a0a0a0] hover:text-white'
          }`}
          onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_TAB', tab: 'prototype' })}
        >
          Prototype
        </button>
        <button
          className="text-[#a0a0a0] hover:text-white cursor-pointer px-2"
          onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
        >
          <PanelRightClose size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.rightSidebarTab === 'prototype' ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <p className="text-[#666666] text-[13px] italic">
                Prototype interactions
              </p>
              <p className="text-[#555555] text-[11px] mt-2">
                Select an element and add interactions to create prototypes
              </p>
            </div>
          </div>
        ) : !selectedObj ? (
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-[#666666] text-[13px] italic text-center">
              Select an element to edit its properties
            </p>
          </div>
        ) : (
          <>
            <AlignmentSection obj={selectedObj} />
            <div className="border-t border-[#3c3c3c]" />
            <TransformSection obj={selectedObj} />
            <div className="border-t border-[#3c3c3c]" />
            {isText && (
              <>
                <TextSection obj={selectedObj as unknown as Textbox} />
                <div className="border-t border-[#3c3c3c]" />
              </>
            )}
            {!isLine && <FillSection obj={selectedObj} />}
            {!isLine && <div className="border-t border-[#3c3c3c]" />}
            <StrokeSection obj={selectedObj} />
            <div className="border-t border-[#3c3c3c]" />
            <EffectsSection obj={selectedObj} />
            <div className="border-t border-[#3c3c3c]" />
            <OpacitySection obj={selectedObj} />
            <div className="border-t border-[#3c3c3c]" />
            {isRect && (
              <>
                <CornerRadiusSection obj={selectedObj as Rect} />
                <div className="border-t border-[#3c3c3c]" />
              </>
            )}
            <ExportSection obj={selectedObj} />
            <div className="border-t border-[#3c3c3c]" />
            <ActionsSection />
          </>
        )}
      </div>
    </div>
  );
}
