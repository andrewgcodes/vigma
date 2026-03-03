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
  | 'pencil';

export interface SerializedObject {
  [key: string]: unknown;
}

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
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
  layers: LayerInfo[];
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
  | { type: 'SET_HISTORY'; history: string[]; historyIndex: number };
