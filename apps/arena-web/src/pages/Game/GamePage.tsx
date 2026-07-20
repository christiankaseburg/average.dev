import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/game-canvas/game-canvas';
import { HUD } from '../../components/hud/hud';
import { useGame } from '../../context/GameContext';

/**
 * Game page — renders the Phaser canvas and HUD overlay.
 * Listens for game phase 'ended' to navigate to /gameover.
 * Guarded by ProtectedGameRoute so state.stateHandler is always non-null here.
 */
export function GamePage() {
  const { state, leaveRoom, setWinner } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    const { stateHandler, room } = state;
    if (!stateHandler || !room) return;

    const handlePhaseChange = (phase: string) => {
      if (phase === 'ended') {
        const winner = (room.state as { winnerId: string }).winnerId;
        setWinner(winner);
        navigate('/gameover');
      }
    };

    stateHandler.on('gamePhaseChange', handlePhaseChange);

    return () => {
      stateHandler.off('gamePhaseChange', handlePhaseChange);
    };
  }, [state, navigate, setWinner]);

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  if (!state.stateHandler) return null;

  return (
    <>
      <GameCanvas stateHandler={state.stateHandler} />
      <HUD stateHandler={state.stateHandler} onLeave={handleLeave} />
    </>
  );
}
