export type ToolType =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'star'
  | 'text'
  | 'pencil'
  | 'frame'
  | 'pen';

export interface SerializedObject {
  [key: string]: unknown;
}

export interface ColorStyle {
  id: string;
  name: string;
  color: string;
}

export interface PageInfo {
  id: string;
  name: string;
  canvasJSON: string | null;
}

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
  showExportModal: boolean;
  toastMessage: string | null;
  pages: PageInfo[];
  activePageId: string;
  colorStyles: ColorStyle[];
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
  | { type: 'ADD_PAGE'; page: PageInfo }
  | { type: 'DELETE_PAGE'; pageId: string }
  | { type: 'RENAME_PAGE'; pageId: string; name: string }
  | { type: 'SET_ACTIVE_PAGE'; pageId: string }
  | { type: 'SAVE_PAGE_STATE'; pageId: string; canvasJSON: string }
  | { type: 'ADD_COLOR_STYLE'; style: ColorStyle }
  | { type: 'DELETE_COLOR_STYLE'; styleId: string }
  | { type: 'UPDATE_COLOR_STYLE'; styleId: string; color: string };

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  selected: boolean;
  children?: LayerInfo[];
  depth: number;
  expanded?: boolean;
  isComponent?: boolean;
  isInstance?: boolean;
}

export interface ContextMenuOption {
  label: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}
