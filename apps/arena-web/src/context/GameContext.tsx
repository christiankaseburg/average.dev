import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Room } from '@colyseus/sdk';
import { StateHandler } from '../network/state-handler';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type GameContextState = {
  room: Room | null;
  stateHandler: StateHandler | null;
  winner: string;
};

const initialGameState: GameContextState = {
  room: null,
  stateHandler: null,
  winner: '',
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type GameContextAction =
  | { type: 'JOIN_ROOM'; room: Room; stateHandler: StateHandler }
  | { type: 'LEAVE_ROOM' }
  | { type: 'SET_WINNER'; winner: string };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function gameContextReducer(
  state: GameContextState,
  action: GameContextAction
): GameContextState {
  switch (action.type) {
    case 'JOIN_ROOM':
      return { room: action.room, stateHandler: action.stateHandler, winner: '' };
    case 'LEAVE_ROOM':
      return { ...initialGameState };
    case 'SET_WINNER':
      return { ...state, winner: action.winner };
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

  const joinRoom = (room: Room) => {
    const stateHandler = new StateHandler(room);
    dispatch({ type: 'JOIN_ROOM', room, stateHandler });
  };

  const leaveRoom = () => {
    if (state.room) {
      state.room.leave();
    }
    dispatch({ type: 'LEAVE_ROOM' });
  };

  const setWinner = (winner: string) => {
    dispatch({ type: 'SET_WINNER', winner });
  };

  return (
    <GameContext.Provider value={{ state, joinRoom, leaveRoom, setWinner }}>
      {children}
    </GameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the active game room, stateHandler, and winner from any component
 * inside <GameProvider>. Throws if used outside the provider.
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
