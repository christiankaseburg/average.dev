import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface ProtectedGameRouteProps {
  children: ReactNode;
}

/**
 * Route guard that redirects to home if the user has no active Colyseus room.
 * Used to protect /game and /gameover routes.
 */
export function ProtectedGameRoute({ children }: ProtectedGameRouteProps) {
  const { state } = useGame();

  if (!state.room || !state.stateHandler) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
