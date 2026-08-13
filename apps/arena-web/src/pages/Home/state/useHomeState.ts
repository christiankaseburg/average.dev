import { useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableRooms, joinOrCreateRoom, joinRoomById, detectDeviceType } from '../../../network/client';
import { useGame } from '../../../context/GameContext';
import { initialState } from './state';
import { homeReducer } from './reducer';

// Re-export types so consumers only need one import path
export type { HomeState } from './state';
export type { HomeAction } from './reducer';

/**
 * useHomeState — orchestrates the Home page's state and async side effects.
 */
export function useHomeState() {
  const [state, dispatch] = useReducer(homeReducer, initialState);
  const { joinRoom, setMap } = useGame();
  const navigate = useNavigate();

  // Load persisted character preferences on mount
  useEffect(() => {
    const savedBody = localStorage.getItem('arena_bodyType');
    const savedHair = localStorage.getItem('arena_hairStyle');
    const savedMap = localStorage.getItem('arena_mapId');
    if (savedBody || savedHair) {
      dispatch({
        type: 'LOAD_PREFERENCES',
        bodyType: savedBody ?? initialState.bodyType,
        hairStyle: savedHair ?? initialState.hairStyle,
      });
    }
    if (savedMap) {
      dispatch({ type: 'SET_MAP', payload: savedMap });
    }
  }, []);

  // Sync map selection to GameContext whenever it changes
  useEffect(() => {
    setMap(state.mapId);
    localStorage.setItem('arena_mapId', state.mapId);
  }, [state.mapId, setMap]);

  const deviceType = detectDeviceType();

  const requestFullscreen = () => {
    if (deviceType === 'mobile' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.warn('Fullscreen request failed:', e);
      });
    }
  };

  const handleQuickPlay = async () => {
    if (!state.name) return dispatch({ type: 'SET_ERROR', payload: 'Please enter a display name' });
    requestFullscreen();
    dispatch({ type: 'SET_CONNECTING', payload: true });
    try {
      const room = await joinOrCreateRoom('arena', {
        name: state.name,
        deviceType,
        matchMode: 'mixed',
        bodyType: state.bodyType,
        hairStyle: state.hairStyle,
      });
      joinRoom(room);
      navigate('/game');
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Failed to join' });
    }
  };

  const handleSandbox = async () => {
    if (!state.name) return dispatch({ type: 'SET_ERROR', payload: 'Please enter a display name' });
    requestFullscreen();
    dispatch({ type: 'SET_CONNECTING', payload: true });
    try {
      const room = await joinOrCreateRoom('sandbox', {
        name: state.name,
        deviceType,
        matchMode: 'mixed',
        bodyType: state.bodyType,
        hairStyle: state.hairStyle,
      });
      joinRoom(room);
      navigate('/game');
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Failed to join Sandbox' });
    }
  };

  const handleJoinByCode = async () => {
    if (!state.name) return dispatch({ type: 'SET_ERROR', payload: 'Please enter a display name' });
    if (!state.roomCode) return dispatch({ type: 'SET_ERROR', payload: 'Please enter a room code' });
    requestFullscreen();
    dispatch({ type: 'SET_CONNECTING', payload: true });
    try {
      const rooms = await getAvailableRooms('arena');
      const target = rooms.find(r => r.metadata?.roomCode === state.roomCode);
      if (target) {
        const room = await joinRoomById(target.roomId, {
          name: state.name,
          deviceType,
          bodyType: state.bodyType,
          hairStyle: state.hairStyle,
        });
        joinRoom(room);
        navigate('/game');
      } else {
        throw new Error('Room not found');
      }
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Failed to join' });
    }
  };

  const handleSaveCustomization = () => {
    localStorage.setItem('arena_bodyType', state.bodyType);
    localStorage.setItem('arena_hairStyle', state.hairStyle);
    dispatch({ type: 'HIDE_CUSTOMIZE' });
  };

  return {
    state,
    dispatch,
    deviceType,
    handleQuickPlay,
    handleSandbox,
    handleJoinByCode,
    handleSaveCustomization,
  };
}
