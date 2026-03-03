export type ToolType =
  | 'select'
  | 'hand'
  | 'frame'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'star'
  | 'text'
  | 'pencil'
  | 'pen';

export interface SerializedObject {
  [key: string]: unknown;
}

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  children?: LayerInfo[];
  expanded?: boolean;
}

export interface PageInfo {
  id: string;
  name: string;
  canvasJSON: string | null;
}

export type RightSidebarTab = 'design' | 'prototype';

export interface AppState {
  activeTool: ToolType;
  selectedObjectIds: string[];
  zoom: number;
  gridEnabled: boolean;
  clipboard: SerializedObject[] | null;
  historyIndex: number;
  history: string[];
  canvasReady: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarTab: RightSidebarTab;
  showExportModal: boolean;
  toastMessage: string | null;
  layers: LayerInfo[];
  pages: PageInfo[];
  activePageId: string;
}

export type AppAction =
  | { type: 'SET_TOOL'; tool: ToolType }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_CLIPBOARD'; data: SerializedObject[] }
  | { type: 'PUSH_HISTORY'; state: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_SELECTED'; ids: string[] }
  | { type: 'TOGGLE_LEFT_SIDEBAR' }
  | { type: 'TOGGLE_RIGHT_SIDEBAR' }
  | { type: 'SHOW_EXPORT_MODAL' }
  | { type: 'HIDE_EXPORT_MODAL' }
  | { type: 'SHOW_TOAST'; message: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'SET_CANVAS_READY' }
  | { type: 'SET_LAYERS'; layers: LayerInfo[] }
  | { type: 'SET_HISTORY'; history: string[]; historyIndex: number }
  | { type: 'SET_RIGHT_SIDEBAR_TAB'; tab: RightSidebarTab }
  | { type: 'ADD_PAGE'; page: PageInfo }
  | { type: 'SET_ACTIVE_PAGE'; pageId: string }
  | { type: 'RENAME_PAGE'; pageId: string; name: string }
  | { type: 'DELETE_PAGE'; pageId: string }
  | { type: 'UPDATE_PAGE_CANVAS'; pageId: string; canvasJSON: string }
  | { type: 'SET_PAGES_STATE'; pages: PageInfo[]; activePageId: string };
