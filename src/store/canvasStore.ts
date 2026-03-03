import { createContext, useContext } from 'react';
import type { AppState, AppAction } from '../types';
import type { Canvas } from 'fabric';

const defaultPageId = 'page-1';

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
  rightSidebarTab: 'design',
  showExportModal: false,
  toastMessage: null,
  layers: [],
  pages: [{ id: defaultPageId, name: 'Page 1', canvasJSON: null }],
  activePageId: defaultPageId,
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
    case 'SET_RIGHT_SIDEBAR_TAB':
      return { ...state, rightSidebarTab: action.tab };
    case 'ADD_PAGE':
      return { ...state, pages: [...state.pages, action.page] };
    case 'SET_ACTIVE_PAGE':
      return { ...state, activePageId: action.pageId };
    case 'RENAME_PAGE':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId ? { ...p, name: action.name } : p
        ),
      };
    case 'DELETE_PAGE':
      if (state.pages.length <= 1) return state;
      return {
        ...state,
        pages: state.pages.filter((p) => p.id !== action.pageId),
        activePageId:
          state.activePageId === action.pageId
            ? state.pages.find((p) => p.id !== action.pageId)!.id
            : state.activePageId,
      };
    case 'UPDATE_PAGE_CANVAS':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId ? { ...p, canvasJSON: action.canvasJSON } : p
        ),
      };
    case 'SET_PAGES_STATE':
      return { ...state, pages: action.pages, activePageId: action.activePageId };
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
