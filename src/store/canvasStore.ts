import { createContext, useContext } from 'react';
import type { AppState, AppAction } from '../types';
import type { Canvas } from 'fabric';

export const initialState: AppState = {
  activeTool: 'select',
  selectedObjectIds: [],
  zoom: 1,
  gridEnabled: false,
  clipboard: null,
  historyIndex: -1,
  history: [],
  canvasReady: false,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  showExportModal: false,
  toastMessage: null,
  layers: [],
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, activeTool: action.tool };
    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(Math.max(action.zoom, 0.1), 5) };
    case 'TOGGLE_GRID':
      return { ...state, gridEnabled: !state.gridEnabled };
    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.data };
    case 'PUSH_HISTORY': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action.state);
      if (newHistory.length > 50) newHistory.shift();
      return {
        ...state,
        history: newHistory,
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }
    case 'SET_HISTORY':
      return { ...state, history: action.history, historyIndex: action.historyIndex };
    case 'UNDO':
      return state.historyIndex > 0
        ? { ...state, historyIndex: state.historyIndex - 1 }
        : state;
    case 'REDO':
      return state.historyIndex < state.history.length - 1
        ? { ...state, historyIndex: state.historyIndex + 1 }
        : state;
    case 'SET_SELECTED':
      return { ...state, selectedObjectIds: action.ids };
    case 'TOGGLE_LEFT_SIDEBAR':
      return { ...state, leftSidebarOpen: !state.leftSidebarOpen };
    case 'TOGGLE_RIGHT_SIDEBAR':
      return { ...state, rightSidebarOpen: !state.rightSidebarOpen };
    case 'SHOW_EXPORT_MODAL':
      return { ...state, showExportModal: true };
    case 'HIDE_EXPORT_MODAL':
      return { ...state, showExportModal: false };
    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.message };
    case 'HIDE_TOAST':
      return { ...state, toastMessage: null };
    case 'SET_CANVAS_READY':
      return { ...state, canvasReady: true };
    case 'SET_LAYERS':
      return { ...state, layers: action.layers };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  canvasRef: React.MutableRefObject<Canvas | null>;
}

export const AppContext = createContext<AppContextType>({
  state: initialState,
  dispatch: () => {},
  canvasRef: { current: null },
});

export function useAppContext() {
  return useContext(AppContext);
}
