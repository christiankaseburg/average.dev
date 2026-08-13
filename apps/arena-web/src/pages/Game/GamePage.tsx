import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/game-canvas/GameCanvas';
import { HUD } from '../../components/hud/HUD';
import { MobileControls } from '../../components/mobile-controls/MobileControls';
import { useGame } from '../../context/GameContext';
import { ItemProvider } from '../../context/ItemContext';
import { AdminPanel } from '../../components/admin-panel/AdminPanel';
import { EquipmentHUD } from '../../components/hud/EquipmentHUD';

/**
 * Game page — renders the Three.js 3D canvas, HUD overlay, and mobile controls.
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
    <ItemProvider stateHandler={state.stateHandler}>
      <GameCanvas />
      <HUD stateHandler={state.stateHandler} onLeave={handleLeave} />
      <AdminPanel />
      <EquipmentHUD />
      <MobileControls />
    </ItemProvider>
  );
}
