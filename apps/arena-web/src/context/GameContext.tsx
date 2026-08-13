import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Room } from '@colyseus/sdk';
import { StateHandler } from '../network/state-handler';
import { getDefaultMapId } from '../engine/world/maps';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type GameContextState = {
  room: Room | null;
  stateHandler: StateHandler | null;
  winner: string;
  mapId: string;
};

const initialGameState: GameContextState = {
  room: null,
  stateHandler: null,
  winner: '',
  mapId: getDefaultMapId(),
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type GameContextAction =
  | { type: 'JOIN_ROOM'; room: Room; stateHandler: StateHandler }
  | { type: 'LEAVE_ROOM' }
  | { type: 'SET_WINNER'; winner: string }
  | { type: 'SET_MAP'; mapId: string };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function gameContextReducer(
  state: GameContextState,
  action: GameContextAction
): GameContextState {
  switch (action.type) {
    case 'JOIN_ROOM':
      return { ...state, room: action.room, stateHandler: action.stateHandler, winner: '' };
    case 'LEAVE_ROOM':
      return { ...initialGameState, mapId: state.mapId };
    case 'SET_WINNER':
      return { ...state, winner: action.winner };
    case 'SET_MAP':
      return { ...state, mapId: action.mapId };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface GameContextValue {
  state: GameContextState;
  /** Join a Colyseus room — creates the StateHandler and stores both in context. */
  joinRoom: (room: Room) => void;
  /** Leave the current room, clear context. */
  leaveRoom: () => void;
  /** Record the winning session ID after the game ends. */
  setWinner: (winner: string) => void;
  /** Set the active map by id. */
  setMap: (mapId: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameContextReducer, initialGameState);

  const joinRoom = useCallback((room: Room) => {
    const stateHandler = new StateHandler(room);
    dispatch({ type: 'JOIN_ROOM', room, stateHandler });
  }, []);

  const leaveRoom = useCallback(() => {
    if (state.room) {
      state.room.leave();
    }
    dispatch({ type: 'LEAVE_ROOM' });
  }, [state.room]);

  const setWinner = useCallback((winner: string) => {
    dispatch({ type: 'SET_WINNER', winner });
  }, []);

  const setMap = useCallback((mapId: string) => {
    dispatch({ type: 'SET_MAP', mapId });
  }, []);

  return (
    <GameContext.Provider value={{ state, joinRoom, leaveRoom, setWinner, setMap }}>
      {children}
    </GameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the active game room, stateHandler, winner, and map selection
 * from any component inside <GameProvider>. Throws if used outside the provider.
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
