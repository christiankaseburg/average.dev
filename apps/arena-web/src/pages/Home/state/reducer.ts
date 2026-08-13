import type { HomeState } from './state';

export type HomeAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_BODY_TYPE'; payload: string }
  | { type: 'SET_HAIR_STYLE'; payload: string }
  | { type: 'SHOW_CUSTOMIZE' }
  | { type: 'HIDE_CUSTOMIZE' }
  | { type: 'SHOW_EQUIPMENT_VIEWER' }
  | { type: 'HIDE_EQUIPMENT_VIEWER' }
  | { type: 'LOAD_PREFERENCES'; bodyType: string; hairStyle: string }
  | { type: 'SET_MAP'; payload: string };

export function homeReducer(state: HomeState, action: HomeAction): HomeState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload, error: '' };
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, connecting: false };
    case 'CLEAR_ERROR':
      return { ...state, error: '' };
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload, error: '' };
    case 'SET_BODY_TYPE':
      return { ...state, bodyType: action.payload };
    case 'SET_HAIR_STYLE':
      return { ...state, hairStyle: action.payload };
    case 'SHOW_CUSTOMIZE':
      return { ...state, showCustomize: true };
    case 'HIDE_CUSTOMIZE':
      return { ...state, showCustomize: false };
    case 'SHOW_EQUIPMENT_VIEWER':
      return { ...state, showEquipmentViewer: true };
    case 'HIDE_EQUIPMENT_VIEWER':
      return { ...state, showEquipmentViewer: false };
    case 'LOAD_PREFERENCES':
      return { ...state, bodyType: action.bodyType, hairStyle: action.hairStyle };
    case 'SET_MAP':
      return { ...state, mapId: action.payload };
    default:
      return state;
  }
}
