import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface ProtectedGameRouteProps {
  children: ReactNode;
}

/**
 * Redirects to / if no active room exists in GameContext.
 * Prevents direct URL access to /game or /gameover without a session.
 */
export function ProtectedGameRoute({ children }: ProtectedGameRouteProps) {
  const { state } = useGame();

  if (!state.room) {
    return <Navigate to="/" replace />;
  }

  return children;
}
