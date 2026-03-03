import { useReducer, useRef } from 'react';
import type { Canvas } from 'fabric';
import { AppContext, appReducer, initialState } from './store/canvasStore';
import Toolbar from './components/Toolbar/Toolbar';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import RightSidebar from './components/RightSidebar/RightSidebar';
import CanvasArea from './components/Canvas/CanvasArea';
import ExportModal from './components/ExportModal/ExportModal';
import ContextMenu from './components/ContextMenu/ContextMenu';
import Toast from './components/Toast/Toast';

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const canvasRef = useRef<Canvas | null>(null);

  return (
    <AppContext.Provider value={{ state, dispatch, canvasRef }}>
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#1a1a1a]">
        <Toolbar />
        <div className="flex flex-1 min-h-0">
          <LeftSidebar />
          <CanvasArea />
          <RightSidebar />
        </div>
      </div>
      <ExportModal />
      <ContextMenu />
      <Toast />
    </AppContext.Provider>
  );
}
