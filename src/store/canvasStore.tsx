import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { AppState, AppAction, ToolType, SerializedObject, PageInfo, ColorStyle } from '../types';

const MAX_HISTORY = 50;

const DEFAULT_PAGE_ID = 'page-1';

const initialState: AppState = {
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
  pages: [{ id: DEFAULT_PAGE_ID, name: 'Page 1', canvasJSON: null }],
  activePageId: DEFAULT_PAGE_ID,
  colorStyles: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
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
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return { ...state, history: newHistory, historyIndex: newHistory.length - 1 };
      }
      return { ...state, history: newHistory, historyIndex: newHistory.length - 1 };
    }
    case 'UNDO':
      if (state.historyIndex > 0) {
        return { ...state, historyIndex: state.historyIndex - 1 };
      }
      return state;
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        return { ...state, historyIndex: state.historyIndex + 1 };
      }
      return state;
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
    case 'ADD_PAGE':
      return { ...state, pages: [...state.pages, action.page] };
    case 'DELETE_PAGE':
      if (state.pages.length <= 1) return state;
      return {
        ...state,
        pages: state.pages.filter((p) => p.id !== action.pageId),
        activePageId: state.activePageId === action.pageId ? state.pages[0].id : state.activePageId,
      };
    case 'RENAME_PAGE':
      return {
        ...state,
        pages: state.pages.map((p) => (p.id === action.pageId ? { ...p, name: action.name } : p)),
      };
    case 'SET_ACTIVE_PAGE':
      return { ...state, activePageId: action.pageId, historyIndex: -1, history: [] };
    case 'SAVE_PAGE_STATE':
      return {
        ...state,
        pages: state.pages.map((p) => (p.id === action.pageId ? { ...p, canvasJSON: action.canvasJSON } : p)),
      };
    case 'ADD_COLOR_STYLE':
      return { ...state, colorStyles: [...state.colorStyles, action.style] };
    case 'DELETE_COLOR_STYLE':
      return { ...state, colorStyles: state.colorStyles.filter((s) => s.id !== action.styleId) };
    case 'UPDATE_COLOR_STYLE':
      return {
        ...state,
        colorStyles: state.colorStyles.map((s) => (s.id === action.styleId ? { ...s, color: action.color } : s)),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  setClipboard: (data: SerializedObject[]) => void;
  pushHistory: (s: string) => void;
  undo: () => void;
  redo: () => void;
  setSelected: (ids: string[]) => void;
  showToast: (message: string) => void;
  addPage: (page: PageInfo) => void;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  setActivePage: (pageId: string) => void;
  savePageState: (pageId: string, canvasJSON: string) => void;
  addColorStyle: (style: ColorStyle) => void;
  deleteColorStyle: (styleId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setTool = useCallback((tool: ToolType) => dispatch({ type: 'SET_TOOL', tool }), []);
  const setZoom = useCallback((zoom: number) => dispatch({ type: 'SET_ZOOM', zoom }), []);
  const toggleGrid = useCallback(() => dispatch({ type: 'TOGGLE_GRID' }), []);
  const setClipboard = useCallback((data: SerializedObject[]) => dispatch({ type: 'SET_CLIPBOARD', data }), []);
  const pushHistory = useCallback((s: string) => dispatch({ type: 'PUSH_HISTORY', state: s }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const setSelected = useCallback((ids: string[]) => dispatch({ type: 'SET_SELECTED', ids }), []);
  const showToast = useCallback((message: string) => {
    dispatch({ type: 'SHOW_TOAST', message });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
  }, []);
  const addPage = useCallback((page: PageInfo) => dispatch({ type: 'ADD_PAGE', page }), []);
  const deletePage = useCallback((pageId: string) => dispatch({ type: 'DELETE_PAGE', pageId }), []);
  const renamePage = useCallback((pageId: string, name: string) => dispatch({ type: 'RENAME_PAGE', pageId, name }), []);
  const setActivePage = useCallback((pageId: string) => dispatch({ type: 'SET_ACTIVE_PAGE', pageId }), []);
  const savePageState = useCallback((pageId: string, canvasJSON: string) => dispatch({ type: 'SAVE_PAGE_STATE', pageId, canvasJSON }), []);
  const addColorStyle = useCallback((style: ColorStyle) => dispatch({ type: 'ADD_COLOR_STYLE', style }), []);
  const deleteColorStyle = useCallback((styleId: string) => dispatch({ type: 'DELETE_COLOR_STYLE', styleId }), []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setTool,
        setZoom,
        toggleGrid,
        setClipboard,
        pushHistory,
        undo,
        redo,
        setSelected,
        showToast,
        addPage,
        deletePage,
        renamePage,
        setActivePage,
        savePageState,
        addColorStyle,
        deleteColorStyle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
